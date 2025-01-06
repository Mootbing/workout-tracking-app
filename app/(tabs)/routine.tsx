import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { Link, router, useNavigation } from 'expo-router';
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView} from 'react-native';
import { displayWorkoutItenaryString } from '../helper/parser';

const RoutineScreen = () => {

    //get params
    const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

    const {category, day, routine} = workoutSelected;

    const [routinesLeft, setRoutinesLeft] = useState(routine);

    console.log(workoutSelected);

    return (
        <ScrollView style={styles.container}>
            <ThemedText type="default">Day {day} - {category}</ThemedText>
            <ThemedText type="title">{displayWorkoutItenaryString(routinesLeft[0])}</ThemedText>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        paddingTop: "25%"
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default RoutineScreen;