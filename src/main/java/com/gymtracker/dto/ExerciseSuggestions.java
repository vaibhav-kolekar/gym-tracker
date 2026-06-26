package com.gymtracker.dto;

import java.util.List;

public record ExerciseSuggestions(
        List<String> names,
        List<String> muscleGroups,
        List<String> weightKg,
        List<String> repetitions,
        List<String> sets,
        List<String> notes
) {
}
