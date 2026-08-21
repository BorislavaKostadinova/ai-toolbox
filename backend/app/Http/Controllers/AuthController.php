<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => [
                'required',
                'email',
            ],
            'password' => [
                'required',
                'string',
            ],
        ]);

        $rateLimitKey =
            'login:' .
            strtolower($credentials['email']) .
            ':' .
            $request->ip();

        if (RateLimiter::tooManyAttempts(
            $rateLimitKey,
            5
        )) {
            $seconds = RateLimiter::availableIn(
                $rateLimitKey
            );

            return response()->json([
                'message' =>
                    "Too many login attempts. Try again in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where(
            'email',
            $credentials['email']
        )->first();

        if (
            !$user ||
            !Hash::check(
                $credentials['password'],
                $user->password
            )
        ) {
            RateLimiter::hit(
                $rateLimitKey,
                60
            );

            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }

        RateLimiter::clear($rateLimitKey);

        /*
         * Ако 2FA е изключена за конкретен потребител,
         * запазваме старото login поведение.
         */
        if (!$user->two_factor_enabled) {
            Auth::login($user);

            $request->session()->regenerate();

            ActivityLog::record(
                'user_login',
                $user,
                [
                    'two_factor' => false,
                ]
            );

            return response()->json([
                'message' => 'Login successful.',
                'requires_two_factor' => false,
                'user' => $user,
            ]);
        }

        $this->sendTwoFactorCode(
            $request,
            $user
        );

        return response()->json([
            'message' =>
                'A verification code has been sent to your email.',
            'requires_two_factor' => true,
            'email' => $this->maskEmail(
                $user->email
            ),
        ]);
    }

    public function verifyTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'digits:6',
            ],
        ]);

        $userId = $request
            ->session()
            ->get('two_factor_user_id');

        if (!$userId) {
            return response()->json([
                'message' =>
                    'Your verification session has expired. Please log in again.',
            ], 422);
        }

        $user = User::find($userId);

        if (!$user) {
            $this->clearPendingTwoFactor(
                $request
            );

            return response()->json([
                'message' =>
                    'Unable to verify this login.',
            ], 422);
        }

        $key = $this->twoFactorCacheKey(
            $request,
            $user
        );

        $twoFactorData = Cache::get($key);

        if (!$twoFactorData) {
            $this->clearPendingTwoFactor(
                $request
            );

            return response()->json([
                'message' =>
                    'The verification code has expired. Please log in again.',
            ], 422);
        }

        $attemptKey =
            '2fa-attempt:' .
            $request->session()->getId();

        if (RateLimiter::tooManyAttempts(
            $attemptKey,
            5
        )) {
            return response()->json([
                'message' =>
                    'Too many verification attempts. Please try again later.',
            ], 429);
        }

        if (
            !Hash::check(
                $validated['code'],
                $twoFactorData['hash']
            )
        ) {
            RateLimiter::hit(
                $attemptKey,
                60
            );

            return response()->json([
                'message' =>
                    'The verification code is incorrect.',
            ], 422);
        }

        RateLimiter::clear($attemptKey);
        Cache::forget($key);

        $request
            ->session()
            ->forget('two_factor_user_id');

        Auth::login($user);

        $request->session()->regenerate();

        ActivityLog::record(
            'user_login',
            $user,
            [
                'two_factor' => true,
                'method' => 'email',
            ]
        );

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
        ]);
    }

    public function resendTwoFactor(Request $request)
    {
        $userId = $request
            ->session()
            ->get('two_factor_user_id');

        if (!$userId) {
            return response()->json([
                'message' =>
                    'No pending two-factor authentication request exists.',
            ], 422);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' =>
                    'Unable to resend verification code.',
            ], 422);
        }

        $rateLimitKey =
            '2fa-resend:' .
            $request->session()->getId();

        if (RateLimiter::tooManyAttempts(
            $rateLimitKey,
            3
        )) {
            $seconds = RateLimiter::availableIn(
                $rateLimitKey
            );

            return response()->json([
                'message' =>
                    "Please wait {$seconds} seconds before requesting another code.",
            ], 429);
        }

        RateLimiter::hit(
            $rateLimitKey,
            60
        );

        $this->sendTwoFactorCode(
            $request,
            $user
        );

        return response()->json([
            'message' =>
                'A new verification code has been sent.',
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            ActivityLog::record(
                'user_logout',
                $request->user()
            );
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request
            ->session()
            ->regenerateToken();

        return response()->json([
            'message' => 'Logged out.',
        ]);
    }

    private function sendTwoFactorCode(
        Request $request,
        User $user
    ): void {
        $code = (string) random_int(
            100000,
            999999
        );

        /*
         * В session пазим само кой user чака 2FA.
         * Самият OTP не се пази в plaintext.
         */
        $request
            ->session()
            ->put(
                'two_factor_user_id',
                $user->id
            );

        $key = $this->twoFactorCacheKey(
            $request,
            $user
        );

        Cache::put(
            $key,
            [
                'hash' => Hash::make($code),
            ],
            now()->addMinutes(10)
        );

        $user->notify(
            new TwoFactorCodeNotification(
                $code
            )
        );
    }

    private function twoFactorCacheKey(
        Request $request,
        User $user
    ): string {
        return
            '2fa:' .
            $request->session()->getId() .
            ':' .
            $user->id;
    }

    private function clearPendingTwoFactor(
        Request $request
    ): void {
        $request
            ->session()
            ->forget('two_factor_user_id');
    }

    private function maskEmail(
        string $email
    ): string {
        [$name, $domain] =
            explode('@', $email, 2);

        $visible =
            substr($name, 0, 2);

        return
            $visible .
            str_repeat(
                '*',
                max(strlen($name) - 2, 2)
            ) .
            '@' .
            $domain;
    }
}
