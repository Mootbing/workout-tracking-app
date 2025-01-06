import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { Link, router, useNavigation } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Button, Image, TouchableOpacity} from 'react-native';
import { displayWorkoutItenaryString } from '../helper/parser';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';

const restRoutine = {
    name: "Rest",
    set: 1,
    rep: null,
    time: 30,
    double: false
}

const RoutineScreen = () => {

    //get params
    const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

    const {category, day, routine} = workoutSelected;

    const [routinesLeft, setRoutinesLeft] = useState(routine);

    useEffect(() => {
        Speech.stop();

        if (routinesLeft.length === 0) {
            Speech.speak("Workout Completed Congratulations");
            return;
        }

        Speech.speak(routinesLeft[0].name);

        if (routinesLeft[0].name != "Rest"){
            Speech.speak(routinesLeft[0].set + " sets remaining");
            if (routinesLeft[0].rep != -1){
                Speech.speak(routinesLeft[0].rep + " reps");
            }else {
                Speech.speak("Until Failure");
            }
        }

        if (routinesLeft[0].time){
            Speech.speak(routinesLeft[0].time + " seconds remaining");
        }

        if (routinesLeft[0].double){
            Speech.speak("Double");
        }

    }, [routinesLeft])

    if (routinesLeft.length === 0) {
        return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ThemedText type="title">Workout Completed</ThemedText>
            <ThemedText type="default">Congratulatoins!</ThemedText>
            <Button title="Return to Index" onPress={() => router.back()} />
        </View>
    }

    return (
        <><ScrollView style={styles.container}>
            <View>
                {/* <ThemedText type="subtitle">Playlist:</ThemedText> */}
                {
                    routinesLeft.map((routineItem, index) => {

                        if (index === 0) {
                            return <View style={{marginBottom: 50}}>
                            {/* <ThemedView darkColor='rgba(255, 255, 255, 0.2)' lightColor='rgba(0, 0, 0, 0.2)' style={{ height: 1, marginTop: 25, marginBottom: 25}} /> */}
                            <ThemedText type="title" style={{marginTop: 5}}>{routineItem.name}</ThemedText>
                            {routineItem.name != "Rest" && <ThemedText darkColor='rgba(255, 255, 255, 0.7)' lightColor='rgba(0, 0, 0, 0.7)' type="default" style={{marginTop: 5}}>{routineItem.set} sets remaining</ThemedText>}
                            {routineItem.rep && <ThemedText darkColor='rgba(255, 255, 255, 0.7)' lightColor='rgba(0, 0, 0, 0.7)' type="default" style={{marginTop: 5}}>
                                {
                                    routineItem.rep === -1 ? "Until Failure" : routineItem.rep + " reps"
                                }    
                            </ThemedText>}
                            {routineItem.double && <ThemedText type="default" style={{marginTop: 5}} darkColor='rgba(255, 255, 255, 0.7)' lightColor='rgba(0, 0, 0, 0.7)' >Double</ThemedText>}
                        </View>
                        }

                        return <Pressable key={index} style={{marginBottom: 25}} onPress={() => {
                            const nowAndOn = routinesLeft.slice(index);
                            const later = routinesLeft.slice(0, index);
                                setRoutinesLeft([...nowAndOn, ...later]);
                            }}>
                            <ThemedView darkColor='rgba(255, 255, 255, 0.15)' lightColor='rgba(0, 0, 0, 0.15)' style={{height: 1, marginBottom: 25}} />
                            <ThemedText type="regular" darkColor='rgba(255, 255, 255, 0.7)' lightColor='rgba(0, 0, 0, 0.7)' >{displayWorkoutItenaryString(routineItem).split(" ")[0]}</ThemedText>
                            <ThemedText type="subtitle" style={{marginTop: 5}}>{displayWorkoutItenaryString(routineItem).split(" ").slice(1).join(" ")}</ThemedText>
                            <ThemedText type='default' darkColor='rgb(135, 255, 183)' lightColor='rgb(135, 255, 183)' style={{position: "absolute", right: 0, top: "50%"}}>Swap</ThemedText>
                        </Pressable>
                    })
                }
            </View>
            <View style={{height: 150}}></View>
        </ScrollView>
        <BlurView intensity={20} style={{position: "absolute", bottom: 0, paddingBottom: 25+15, width: "100%"}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 25}}>
                    {routinesLeft[0].name != "Rest" && <TouchableOpacity onPress={() => {
                        let currRoutine = routinesLeft[0];
                        currRoutine.set -= 1;

                        let newItenaries = routinesLeft.slice(1);

                        if (currRoutine.set > 0) {
                            newItenaries = [currRoutine, ...newItenaries];
                        }
                        
                        if (currRoutine.name != "Rest") {
                            newItenaries = [restRoutine, ...newItenaries];
                        }

                        setRoutinesLeft(newItenaries);
                    }}>
                        {/* <Image source={require('@/assets/images/play.png')} style={{width: 24, height: 24}} />  */}
                        <ThemedText type='default' darkColor='rgb(135, 255, 183)' lightColor='rgb(135, 255, 183)'>Do Set</ThemedText>
                    </TouchableOpacity>}
                    {routinesLeft[0].name != "Rest" && <TouchableOpacity onPress={() => {
                        setRoutinesLeft([...routinesLeft.slice(1), routinesLeft[0]]);
                    }}>
                        {/* <Image source={require('@/assets/images/skip.png')} style={{width: 24, height: 24}} />  */}
                        <ThemedText type='default' darkColor='rgb(255, 235, 135)' lightColor='rgb(255, 235, 135)'>Later</ThemedText>
                    </TouchableOpacity>}
                    <TouchableOpacity onPress={() => {
                        setRoutinesLeft(routinesLeft.slice(1));
                    }}>
                        {/* <Image source={require('@/assets/images/delete.png')} style={{width: 24, height: 24}} />  */}
                        <ThemedText type='default' darkColor='rgb(255, 135, 135)' lightColor='rgb(255, 135, 135)'>Skip</ThemedText>
                    </TouchableOpacity>
                </View>
        </BlurView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 25
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default RoutineScreen;