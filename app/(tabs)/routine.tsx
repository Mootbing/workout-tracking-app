import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { Link, router, useNavigation } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Button, Image, TouchableOpacity, Alert, TextInput, Dimensions } from 'react-native';
import { beautifyTime, deleteLastDataPointFromSave, displayWorkoutItenaryString, getWorkoutDataFromSave, getWorkoutSaveURIIfExistsOrMakeNew, importDataToSave, makeSaveURI, pickDocument, pruneLog, speechifyTime, updateWorkoutDataToSave } from '../helper/parser';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-chart-kit';

import * as Sharing from 'expo-sharing';

const restRoutine = {
    name: "Rest",
    set: 0,
    rep: null,
    time: 30,
    double: false
}

const SPEAK_COUNTER = 5;

const RoutineScreen = () => {

    //get params
    const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

    const [loggableStat, setLoggableStat] = useState(0);
    const [showChart, setShowChart] = useState(false);
    const [chartData, setChartData] = useState({});

    const { category, day, routine } = workoutSelected;

    const [routinesLeft, setRoutinesLeft] = useState(routine);

    const [timer, setTimer] = useState(-1);

    const fetchChartDataFor = (routineItem) => {
        console.log(routineItem.name)
        console.log("Fetching")

        getWorkoutDataFromSave(routineItem).then((data) => {
            console.log(data)

            // console.log(data.map((item) => item.timeStamp))
            // console.log(data.map((item) => item.num))
            if (data.length != 0) {
                setChartData({
                    labels: data.slice(-7).map(
                        (item) => {
                            let date = new Date(item.timeStamp);
                            return date.toLocaleDateString().split("/").slice(0, 2).join("/");
                        }
                    ),
                    datasets: [
                        {
                            data: data.slice(-7).map((item) => item.num)
                        }
                    ]
                });
            }
            else {
                setChartData({});
                // setShowChart(false);
            }
        })
    }

    const setChartDataFor = (routineItem) => {

        if (loggableStat == "") {
            return;
        }

        console.log(routineItem.name)
        console.log("Setting")

        updateWorkoutDataToSave(routineItem, loggableStat).then(() => {
            fetchChartDataFor(routineItem);
            setShowChart(true);
        })
    }

    const pruneRests = () => {

        if (routinesLeft.filter((itenary) => itenary.name == "Rest").length == 0) {
            return;
        }

        let newItenaries = routinesLeft.filter((itenary) => itenary.name != "Rest" || itenary.set > 0);
        setRoutinesLeft(newItenaries);
    }

    useEffect(() => {

        setShowChart(false);
        setChartData({});

        Speech.stop();
        setTimer(-1);

        if (routinesLeft.length === 0) {
            Speech.speak("Workout Completed Congratulations");
            Alert.alert("Workout Completed!");
            router.back();
            return;
        }

        Speech.speak(routinesLeft[0].name);

        if (routinesLeft[0].name != "Rest" && routinesLeft[0].set) {
            Speech.speak(routinesLeft[0].set + " sets remaining");
            if (routinesLeft[0].rep) {
                if (routinesLeft[0].rep != -1) {
                    Speech.speak(routinesLeft[0].rep + " reps");
                } else {
                    Speech.speak("Rep Until Failure");
                }
            }
        }

        if (routinesLeft[0].time) {
            Speech.speak(speechifyTime(routinesLeft[0].time));

            setTimer(routinesLeft[0].time);
        }

        if (routinesLeft[0].double) {
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
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                            return <View key={index}>
                                <Text type="default" style={{ fontSize: 75, fontWeight: 700, marginTop: 5, color: "rgba(255, 255, 255, 1)" }} >{
                                    timer > 0 ? beautifyTime(timer) : displayWorkoutItenaryString(routineItem).split(" ")[0]
                                }</Text>
                                <ThemedText type="title" style={{ marginTop: 5, fontWeight: 300, marginBottom: 25 }}>{routineItem.name}</ThemedText>

                                {routinesLeft[0].name != "Rest" && <>
                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: showChart ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
                                                padding: 10,
                                                borderRadius: 5
                                            }}

                                            onPress={() => {
                                                if (!showChart) {
                                                    setShowChart(true);
                                                    fetchChartDataFor(routineItem);
                                                }
                                                else {
                                                    setShowChart(false);
                                                }
                                            }}
                                        >
                                            <Text style={{ color: "rgb(135, 167, 255)", alignSelf: "center" }}>📊</Text>
                                        </TouchableOpacity>

                                        <TextInput
                                            keyboardType='numeric'
                                            placeholder="Loggable (Numeric) Stats: Weight, Time, etc."
                                            placeholderTextColor={"rgba(255, 255, 255, 0.3)"}
                                            value={loggableStat}
                                            onChangeText={(e) => {
                                                setLoggableStat(e.replaceAll(/[^0-9]/g, ''));
                                            }
                                            }
                                            style={{ width: Dimensions.get("window").width - 50 - 100 - 25, backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.5)", padding: 10, borderRadius: 5 }}
                                        />

                                        <TouchableOpacity
                                            style={{
                                                width: 75,
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                padding: 10,
                                                borderRadius: 5
                                            }}

                                            onPress={() => {
                                                setChartDataFor(routineItem);
                                                setLoggableStat(0);
                                            }}
                                        >
                                            <Text style={{ color: "rgb(135, 167, 255)", alignSelf: "center" }}>Log</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {showChart && <View>
                                        {Object.keys(chartData).length != 0 && <LineChart
                                            data={chartData}
                                            width={Dimensions.get("window").width - 50} // from react-native
                                            height={Dimensions.get("window").height * 0.3}
                                            yAxisInterval={1} // optional, defaults to 1
                                            chartConfig={{
                                                backgroundColor: "#000",
                                                decimalPlaces: 0, // optional, defaults to 2dp
                                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                                propsForDots: {
                                                    r: "3"
                                                }
                                            }}
                                            bezier
                                            style={{
                                                marginVertical: 8
                                            }}
                                        />}
                                    </View>}

                                    {showChart && <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
                                        {Object.keys(chartData).length != 0 && <TouchableOpacity
                                            style={{
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                padding: 10,
                                                borderRadius: 5
                                            }}

                                            onPress={() => {
                                                getWorkoutSaveURIIfExistsOrMakeNew(
                                                    makeSaveURI(routineItem.name)
                                                ).then((uri) => {
                                                    console.log(uri)
                                                    Sharing.shareAsync(
                                                        uri
                                                    )
                                                })
                                            }}
                                        >
                                            <Text style={{ color: "rgb(255, 235, 135)", alignSelf: "center" }}>Export</Text>
                                        </TouchableOpacity>}

                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                padding: 10,
                                                borderRadius: 5
                                            }}

                                            onPress={() => {
                                                importDataToSave(routineItem).then(() => {
                                                    fetchChartDataFor(routineItem);
                                                })
                                            }}
                                        >
                                            <Text style={{ color: "rgb(255, 235, 135)", alignSelf: "center" }}>Import</Text>
                                        </TouchableOpacity>

                                        {Object.keys(chartData).length != 0 && <TouchableOpacity
                                            style={{
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                padding: 10,
                                                borderRadius: 5
                                            }}
                                            onPress={() => {
                                                deleteLastDataPointFromSave(routineItem).then(() => {
                                                    fetchChartDataFor(routineItem);
                                                });
                                            }}
                                        >
                                            <Text style={{ color: "rgb(255, 135, 135)", alignSelf: "center" }}>Backspace</Text>
                                        </TouchableOpacity>}

                                        {Object.keys(chartData).length != 0 && <TouchableOpacity
                                            style={{
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                padding: 10,
                                                borderRadius: 5
                                            }}
                                            onPress={() => {
                                            Alert.alert(
                                            "Prune Log of "+ routineItem.name,
                                            "Are you sure you want to remove the logs for "+ routineItem.name +"?",
                                            [
                                                {
                                                text: "Cancel",
                                                onPress: () => console.log("Cancel Pressed"),
                                                style: "cancel"
                                                },
                                                {
                                                text: "OK", onPress: async () => {
                                                        pruneLog(routineItem).then(() => {
                                                            setChartData({});
                                                            setShowChart(false);
                                                        });
                                                    }
                                                }
                                            ]
                                            );
                                        }}>
                                            <Text style={{ color: "rgb(255, 135, 135)", alignSelf: "center" }}>Delete All</Text>
                                        </TouchableOpacity>}
                                    </View>}
                                </>}
                            </View>
                        }

                        return <TouchableOpacity key={index} style={{ marginBottom: 25 }} onPress={() => {
                            const nowAndOn = routinesLeft.slice(index);
                            const later = routinesLeft.slice(0, index);
                            setRoutinesLeft([...nowAndOn, ...later]);
                            pruneRests();
                        }}>
                            <ThemedView darkColor='rgba(255, 255, 255, 0.1)' lightColor='rgba(0, 0, 0, 0.1)' style={{ height: 1, marginBottom: 25 }} />
                            <ThemedText type="regular" darkColor='rgba(255, 255, 255, 0.5)' lightColor='rgba(0, 0, 0, 0.5)' >{displayWorkoutItenaryString(routineItem).split(" ")[0]}</ThemedText>
                            <ThemedText type="default" style={{ fontWeight: 300, color: "rgba(255, 255, 255, 0.9)" }}>{displayWorkoutItenaryString(routineItem).split(" ").slice(1).join(" ")}</ThemedText>
                            <ThemedText type='default' darkColor='rgb(255, 235, 135)' lightColor='rgb(255, 235, 135)' style={{ position: "absolute", right: 0, top: "50%" }}>Swap</ThemedText>
                        </TouchableOpacity>
                    })
                }
            </View>
            <View style={{ height: 150 }}></View>
        </ScrollView>
            <BlurView intensity={10} style={{ position: "absolute", bottom: 0, paddingBottom: 25 + 15, width: "100%" }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 25 }}>
                    {routinesLeft[0].name != "Rest" && <TouchableOpacity style={{ width: "30%", alignItems: "center" }} onPress={() => {
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
        padding: 25,
        backgroundColor: "black"
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default RoutineScreen;