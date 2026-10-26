package com.ledger.diary.controller;

import com.ledger.diary.dto.EntryDtos.EntryRequest;
import com.ledger.diary.dto.EntryDtos.EntryResponse;
import com.ledger.diary.dto.EntryDtos.UnlockRequest;
import com.ledger.diary.entity.User;
import com.ledger.diary.service.EntryService;
import com.ledger.diary.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
public class EntryController {

    private final EntryService entryService;
    private final UserService userService;

    public EntryController(EntryService entryService, UserService userService) {
        this.entryService = entryService;
        this.userService = userService;
    }

    @GetMapping
    public List<EntryResponse> list() {
        return entryService.list();
    }

    @GetMapping("/{id}")
    public EntryResponse get(@PathVariable Long id) {
        return entryService.get(id, false);
    }

    @PostMapping("/{id}/unlock")
    public EntryResponse unlock(@PathVariable Long id, @Valid @RequestBody UnlockRequest request) {
        User user = userService.current();
        if (!userService.matches(user, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "That password is not correct.");
        }
        return entryService.unlock(id);
    }

    @PostMapping
    public ResponseEntity<EntryResponse> create(@Valid @RequestBody EntryRequest request) {
        EntryResponse created = entryService.save(request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public EntryResponse update(@PathVariable Long id, @Valid @RequestBody EntryRequest request) {
        return entryService.save(request, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        entryService.delete(id);
    }

    @PatchMapping("/{id}/favorite")
    public EntryResponse toggleFavorite(@PathVariable Long id) {
        return entryService.favourite(id);
    }
}
