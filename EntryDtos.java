package com.ledger.diary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EntryDtos {

    public record EntryRequest(
        @NotNull(message = "Date is required")
        LocalDate date,

        @NotBlank(message = "Title is required")
        @Size(max = 180, message = "Title must be at most 180 characters")
        String title,

        @NotBlank(message = "Mood is required")
        @Size(max = 30, message = "Mood must be at most 30 characters")
        String mood,

        @NotBlank(message = "Category is required")
        @Size(max = 40, message = "Category must be at most 40 characters")
        String category,

        @NotBlank(message = "Content is required")
        String content,

        String image,

        boolean favourite,

        boolean locked
    ) {}

    public record EntryResponse(
        Long id,
        LocalDate date,
        String title,
        String mood,
        String category,
        String content,
        String image,
        boolean favourite,
        boolean locked,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}

    public record UnlockRequest(
        @NotBlank(message = "Password is required")
        String password
    ) {}
}
