<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCodeNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $code
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your AI ToolBox verification code')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line(
                'Use the following verification code to complete your login:'
            )
            ->line($this->code)
            ->line(
                'The code is valid for 10 minutes.'
            )
            ->line(
                'If you did not attempt to log in, you can ignore this message.'
            );
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}
