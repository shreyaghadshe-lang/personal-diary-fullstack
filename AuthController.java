package com.ledger.diary.controller;

import com.ledger.diary.dto.AuthDtos.LoginRequest;
import com.ledger.diary.dto.AuthDtos.RegisterRequest;
import com.ledger.diary.dto.AuthDtos.UserResponse;
import com.ledger.diary.entity.User;
import com.ledger.diary.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final HttpSessionSecurityContextRepository contextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(UserService userService, AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request,
                                                HttpServletRequest req,
                                                HttpServletResponse res) {
        User user = userService.register(request.name(), request.username(), request.password());
        authenticateAndSetSession(request.username(), request.password(), req, res);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserResponse(user.getId(), user.getName(), user.getUsername()));
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request,
                             HttpServletRequest req,
                             HttpServletResponse res) {
        authenticateAndSetSession(request.username(), request.password(), req, res);
        User user = userService.current();
        return new UserResponse(user.getId(), user.getName(), user.getUsername());
    }

    @GetMapping("/me")
    public UserResponse me() {
        User user = userService.current();
        return new UserResponse(user.getId(), user.getName(), user.getUsername());
    }

    private void authenticateAndSetSession(String username, String password,
                                          HttpServletRequest req, HttpServletResponse res) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, req, res);
    }
}
