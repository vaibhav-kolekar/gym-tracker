
package com.gymtracker.service;

import com.gymtracker.dto.ExerciseSuggestions;
import com.gymtracker.entity.Exercise;
import com.gymtracker.repository.ExerciseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ExerciseService {

    private final ExerciseRepository repo;

    public ExerciseService(ExerciseRepository repo) {
        this.repo = repo;
    }

    public List<Exercise> getAll() {
        return repo.findAllByOrderByPerformedOnDescIdDesc();
    }

    public Exercise getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Exercise log not found with id " + id));
    }

    public Exercise save(Exercise exercise) {
        return repo.save(exercise);
    }

    public ExerciseSuggestions getSuggestions() {
        return new ExerciseSuggestions(
                repo.findDistinctNames(),
                repo.findDistinctMuscleGroups(),
                repo.findDistinctWeights().stream().map(weight -> weight.stripTrailingZeros().toPlainString()).toList(),
                repo.findDistinctRepetitions().stream().map(String::valueOf).toList(),
                repo.findDistinctSets().stream().map(String::valueOf).toList(),
                repo.findDistinctNotes()
        );
    }

    public Exercise update(Long id, Exercise updatedExercise) {
        Exercise exercise = getById(id);
        exercise.setName(updatedExercise.getName());
        exercise.setMuscleGroup(updatedExercise.getMuscleGroup());
        exercise.setWeightKg(updatedExercise.getWeightKg());
        exercise.setRepetitions(updatedExercise.getRepetitions());
        exercise.setSets(updatedExercise.getSets());
        exercise.setPerformedOn(updatedExercise.getPerformedOn());
        exercise.setNotes(updatedExercise.getNotes());
        return repo.save(exercise);
    }

    public void delete(Long id) {
        Exercise exercise = getById(id);
        repo.delete(exercise);
    }
}
