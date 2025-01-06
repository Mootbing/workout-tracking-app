import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { Link, router, useNavigation } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Button} from 'react-native';
import { displayWorkoutItenaryString } from '../helper/parser';
import * as Speech from 'expo-speech';

const RoutineScreen = () => {

    //get params
    const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

    const {category, day, routine} = workoutSelected;

    const [routinesLeft, setRoutinesLeft] = useState(routine);

    return (
        <ScrollView style={styles.container}>
            <View>
                <ThemedText type="title">{routinesLeft[0].name}</ThemedText>
                <ThemedText type="default" darkColor="rgba(255, 255, 255, 0.7)" lightColor='rgba(0, 0, 0, 0.7)'>{routinesLeft[0].set} sets remaining</ThemedText>
                <Button title="Set Done" onPress={() => {
                    routinesLeft[0].set -= 1;
                }} />
            </View>
            <View>
                <ThemedView darkColor='rgba(255, 255, 255, 0.2)' lightColor='rgba(0, 0, 0, 0.2)' style={{ height: 1, marginTop: 25, marginBottom: 25}} />
                <ThemedText type="subtitle">Up next:</ThemedText>
                {
                    routinesLeft.map((routineItem, index) => {
                        return <ThemedText type="default" darkColor="rgba(255, 255, 255, 0.7)" lightColor='rgba(0, 0, 0, 0.7)'>{displayWorkoutItenaryString(routineItem)}</ThemedText>
                    })
                }
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default RoutineScreen;