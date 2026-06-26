
package com.gymtracker.controller;

import com.gymtracker.dto.ExerciseSuggestions;
import com.gymtracker.entity.Exercise;
import com.gymtracker.service.ExerciseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RequestMapping("/api/exercises")
@RestController
public class ExerciseController {
    private final ExerciseService service;

    public ExerciseController(ExerciseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Exercise> all() {
        return service.getAll();
    }

    @GetMapping("/suggestions")
    public ExerciseSuggestions suggestions() {
        return service.getSuggestions();
    }

    @GetMapping("/{id}")
    public Exercise get(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Exercise create(@Valid @RequestBody Exercise exercise) {
        return service.save(exercise);
    }

    @PutMapping("/{id}")
    public Exercise update(@PathVariable Long id, @Valid @RequestBody Exercise exercise) {
        return service.update(id, exercise);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }
}
