import { Stack, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const [workoutSelected, setWorkoutSelected] = useState({});

    return (
        <WorkoutSelectedContext.Provider value={[workoutSelected, setWorkoutSelected]}>
            <Stack
                screenOptions={{
                    // tabBarStyle: { display: 'none' }
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: true,
                        title: `Workout Tracker`,
                    }}
                />
                <Stack.Screen
                    name="routine"
                    options={{
                        title: `Day ${workoutSelected?.day} - ${workoutSelected?.category}`,
                    }}
                />
            </Stack>
        </WorkoutSelectedContext.Provider>
    );
}
