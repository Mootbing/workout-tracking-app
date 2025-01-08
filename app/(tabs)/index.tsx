import { Animated, Image, StyleSheet, Platform, ScrollView, View, Button, Text, StatusBar, Pressable, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useContext, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';

import { CSVStringToJSON, displayWorkoutItenaryString, estimateWorkoutTime, pickDocument, pruneLogs } from '../helper/parser';
import { Collapsible } from '@/components/Collapsible';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getDaysIntoYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear;
}

export default function Index() {
  const [day, setDay] = useState(0);//retrieve from localstorage later

  const [data, setData] = useState([]);
  const [title, setTitle] = useState("Workout Tracker");

  const [peekAll, setPeekAll] = useState(false);

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

  const navigation = useNavigation();

  const setDataFromAsset = async (asset) => {
    const contents = await FileSystem.readAsStringAsync(asset.uri);
    const d = CSVStringToJSON(contents);

    setData(d);
    setDay(getDaysIntoYear() % d.length);

    navigation.setOptions({ title: asset.name + " - " + d.length + " Days" });

    try {
      await AsyncStorage.setItem('last-file', JSON.stringify(asset));
    } catch (e) {
      // saving error
    }
  }

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y:
          73.5 * day
        , animated: true
      });
    }
  }, [data]);

  useEffect(() => {
    let fetchFile = async () => {
      try {
        const value = await AsyncStorage.getItem('last-file');
        if (value !== null) {
          setDataFromAsset(JSON.parse(value));
        }
      } catch (e) {
        // error reading value
      }
    }

    fetchFile();
  }, [])

  return (
    // <ThemedView style={{ }}>
    <Animated.ScrollView style={styles.container} ref={scrollViewRef}>
      {/* <View>
          <ThemedText type="title">{title}</ThemedText>
        </View> */}
      <View style={{ flexDirection: 'column', gap: 25, justifyContent: "flex-end", alignItems: "flex-end" }}>
        <TouchableOpacity onPress={() => {
          pickDocument().then((asset) => {
            if (asset) {
              setDataFromAsset(asset);
            }
          })
        }}>
          <ThemedText type="default">Upload Workout CSV</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "Prune Saved Logs",
            "Are you sure you want to prune all saved logs?",
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
              },
              {
                text: "OK", onPress: async () => {
                  pruneLogs();
                }
              }
            ]
          );
        }}>
          <ThemedText type="default" darkColor='rgb(255, 130, 130)' lightColor='rgb(255, 130, 130)'>Prune Saved Logs</ThemedText>
        </TouchableOpacity>
        {data.length != 0 && <TouchableOpacity onPress={() => {
          setPeekAll(!peekAll);
        }}>
          <ThemedText type="default" darkColor='rgb(255, 235, 135)' lightColor='rgb(255, 235, 135)'>{!peekAll ? "Reveal" : "Hide"} All</ThemedText>
        </TouchableOpacity>}
      </View>
      {data.length != 0 && <View>
        {data.map((item, index) => {

          let getFontSizeByDay = () => "subtitle";
          let isOnCurrentDay = () => index + 1 == day;

          return <View key={index} style={{ position: "relative", paddingTop: 25, borderRadius: 15 }}>
            <ThemedView darkColor='rgba(255, 255, 255, 0.1)' lightColor='rgba(0, 0, 0, 0.1)' style={{ height: 1, marginBottom: 25 }} />
            {item.routine.length != 0 ? <Collapsible fontType={getFontSizeByDay()} title={item.day + " - " + item.category} open={isOnCurrentDay() || peekAll}>
              <ThemedText type='regular' darkColor="rgba(255, 255, 255, 0.5)" lightColor='rgba(0, 0, 0, 0.5)'>
                {item.routine.length} exercises - {estimateWorkoutTime(item.routine)}
              </ThemedText>

              {/* <Link href="routine" asChild> */}
              <Pressable
                style={{ position: "absolute", right: 0, top: -25, height: 50, justifyContent: 'center' }}
                onPress={() => {
                  router.push("routine");
                  setWorkoutSelected(JSON.parse(JSON.stringify(item)));
                }}
              >
                <ThemedText type='default' darkColor='rgb(135, 255, 183)' lightColor='rgb(135, 255, 183)'> Start </ThemedText>
              </Pressable>
              {/* </Link> */}

              <View style={{ paddingTop: 5, paddingLeft: 25 }}>
                {item.routine.map((routineItem, index) => {

                  let displayStrArray = displayWorkoutItenaryString(routineItem).split(" ");

                  return <View key={index} style={{ flexDirection: 'column', paddingTop: 5 }}>
                    <ThemedText type="regular" style={{ paddingTop: 3 }} darkColor="rgba(255, 255, 255, 0.5)" lightColor='rgba(0, 0, 0, 0.5)'>
                      {displayStrArray[0] + " "}
                    </ThemedText>
                    <ThemedText type='default' style={{ fontWeight: 300, paddingLeft: 0 }}>
                      {displayStrArray.slice(1).join(" ")}
                    </ThemedText>
                  </View>
                })}
                {/* <Button title={"Start Day " + item.day + " Workout - " + item.category} onPress={() => {}} /> */}
              </View>
            </Collapsible> : <ThemedText type={getFontSizeByDay()} style={{ fontWeight: 300 }} darkColor='rgba(255, 255, 255, 0.5)' lightColor='rgba(0, 0, 0, 0.5)'>{item.day + " - " + item.category}</ThemedText>}
          </View>
        })}
      </View>}
      <View style={{ height: 100 }} />
    </Animated.ScrollView>
    // </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    // paddingTop: 75,
    backgroundColor: "black"
  },
});
