import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const [workouts, setWorkouts] = useState([]);

    return (
        <WorkoutSelectedContext.Provider value={[workouts, setWorkouts]}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: 'none' }
                }}
            >
                <Tabs.Screen
                    name="index"
                />
                <Tabs.Screen
                    name="routine"
                />
            </Tabs>
        </WorkoutSelectedContext.Provider>
    );
}
