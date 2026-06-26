
package com.gymtracker.repository;

import com.gymtracker.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findAllByOrderByPerformedOnDescIdDesc();

    @Query("select distinct e.name from Exercise e where e.name is not null and trim(e.name) <> '' order by e.name")
    List<String> findDistinctNames();

    @Query("select distinct e.muscleGroup from Exercise e where e.muscleGroup is not null and trim(e.muscleGroup) <> '' order by e.muscleGroup")
    List<String> findDistinctMuscleGroups();

    @Query("select distinct e.weightKg from Exercise e where e.weightKg is not null order by e.weightKg")
    List<java.math.BigDecimal> findDistinctWeights();

    @Query("select distinct e.repetitions from Exercise e where e.repetitions is not null order by e.repetitions")
    List<Integer> findDistinctRepetitions();

    @Query("select distinct e.sets from Exercise e where e.sets is not null order by e.sets")
    List<Integer> findDistinctSets();

    @Query("select distinct e.notes from Exercise e where e.notes is not null and trim(e.notes) <> '' order by e.notes")
    List<String> findDistinctNotes();
}
