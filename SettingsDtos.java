package com.ledger.diary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SettingsDtos {

    public record SettingsRequest(
        @NotBlank
        @Pattern(regexp = "^(light|dark|vintage)$", message = "Theme must be light, dark, or vintage")
        String theme,

        boolean reminders,

        @NotBlank
        @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Time must be in HH:mm format")
        String reminderTime
    ) {}

    public record SettingsResponse(
        String theme,
        boolean reminders,
        String reminderTime
    ) {}

    public record PasswordChangeRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 4, max = 100, message = "New password must be at least 4 characters")
        String newPassword
    ) {}
}
