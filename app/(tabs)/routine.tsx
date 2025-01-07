import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { Link, router, useNavigation } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Button, Image, TouchableOpacity} from 'react-native';
import { beautifyTime, displayWorkoutItenaryString, speechifyTime } from '../helper/parser';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';

const restRoutine = {
    name: "Rest",
    set: 0,
    rep: null,
    time: 5,
    double: false
}

const SPEAK_COUNTER = 5;

const RoutineScreen = () => {

    //get params
    const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

    const {category, day, routine} = workoutSelected;

    const [routinesLeft, setRoutinesLeft] = useState(routine);

    const [timer, setTimer] = useState(-1);

    const pruneRests = () => {

        if (routinesLeft.filter((itenary) => itenary.name == "Rest").length == 0) {
            return;
        }

        let newItenaries = routinesLeft.filter((itenary) => itenary.name != "Rest" || itenary.set > 0);
        setRoutinesLeft(newItenaries);
    }

    useEffect(() => {
        Speech.stop();
        setTimer(-1);

        if (routinesLeft.length === 0) {
            Speech.speak("Workout Completed Congratulations");
            router.back();
            return;
        }

        Speech.speak(routinesLeft[0].name);

        if (routinesLeft[0].name != "Rest" && routinesLeft[0].set){
            Speech.speak(routinesLeft[0].set + " sets remaining");
            if (routinesLeft[0].rep){
                if (routinesLeft[0].rep != -1){
                    Speech.speak(routinesLeft[0].rep + " reps");
                }else {
                    Speech.speak("Rep Until Failure");
                }
            }
        }

        if (routinesLeft[0].time){
            Speech.speak(speechifyTime(routinesLeft[0].time));

            setTimer(routinesLeft[0].time);
        }

        if (routinesLeft[0].double){
            Speech.speak("Double");
        }

    }, [routinesLeft])

    useEffect(() => {

        if (timer === -1) {
            return;
        }

        if (timer <= SPEAK_COUNTER) {
            Speech.speak(timer.toString());
        }

        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(timer - 1);
            }, 1000);

            return () => clearInterval(interval);
        }
        else if (timer == 0) {
            setTimer(-1);
            setRoutinesLeft(routinesLeft.slice(1));
        }
    }, [timer])

    if (routinesLeft.length === 0) {
        return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ThemedText type="subtitle">Workout Completed, Congratulations!</ThemedText>
            <Button title="Back to Home" onPress={() => router.back()} />
        </View>
    }

    return (
        <><ScrollView style={styles.container}>
            <View>
                {/* <ThemedText type="subtitle">Playlist:</ThemedText> */}
                {
                    routinesLeft.map((routineItem, index) => {

                        if (index === 0) {
                            return <View>
                                <Text type="default" style={{fontSize: 75, fontWeight: 700, marginTop: 5, color: "rgba(255, 255, 255, 1)"}} >{
                                    timer > 0 ? beautifyTime(timer) : displayWorkoutItenaryString(routineItem).split(" ")[0]
                                }</Text>
                                <ThemedText type="title" style={{marginTop: 5, fontWeight: 300, marginBottom: 25}}>{routineItem.name}</ThemedText>
                                {/* <ThemedText type="title" style={{marginTop: 50, fontWeight: 300, marginBottom: 25}}>Playlist</ThemedText> */}
                            </View>
                        }

                        return <Pressable key={index} style={{marginBottom: 25}} onPress={() => {
                            const nowAndOn = routinesLeft.slice(index);
                            const later = routinesLeft.slice(0, index);
                                setRoutinesLeft([...nowAndOn, ...later]);
                                pruneRests();
                            }}>
                            <ThemedView darkColor='rgba(255, 255, 255, 0.15)' lightColor='rgba(0, 0, 0, 0.15)' style={{height: 1, marginBottom: 25}} />
                            <ThemedText type="regular" darkColor='rgba(255, 255, 255, 0.5)' lightColor='rgba(0, 0, 0, 0.5)' >{displayWorkoutItenaryString(routineItem).split(" ")[0]}</ThemedText>
                            <ThemedText type="default" style={{fontWeight: 300}}>{displayWorkoutItenaryString(routineItem).split(" ").slice(1).join(" ")}</ThemedText>
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

                        if (newItenaries.length == 0 && currRoutine.set == 0) {
                            setRoutinesLeft([]);
                            return; //done
                        }

                        if (currRoutine.set > 0) {
                            newItenaries = [currRoutine, ...newItenaries];
                        }
                        
                        if (currRoutine.name != "Rest") {
                            newItenaries = [restRoutine, ...newItenaries];
                        }

                        setRoutinesLeft(newItenaries);
                    }}>
                        {/* <Image source={require('@/assets/images/play.png')} style={{width: 24, height: 24}} />  */}
                        <ThemedText type='default' darkColor='rgb(135, 255, 183)' lightColor='rgb(135, 255, 183)'>Set Done</ThemedText>
                    </TouchableOpacity>}
                    {routinesLeft[0].name != "Rest" && routinesLeft.length != 1 && <TouchableOpacity onPress={() => {
                        setRoutinesLeft([...routinesLeft.slice(1), routinesLeft[0]]);
                    }}>
                        {/* <Image source={require('@/assets/images/skip.png')} style={{width: 24, height: 24}} />  */}
                        <ThemedText type='default' darkColor='rgb(255, 235, 135)' lightColor='rgb(255, 235, 135)'>Move To End</ThemedText>
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