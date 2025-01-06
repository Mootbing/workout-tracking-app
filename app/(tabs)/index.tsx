import { Animated, Image, StyleSheet, Platform, ScrollView, View, Button, Text, StatusBar, Pressable } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useContext, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

import {CSVStringToJSON, displayWorkoutItenaryString, estimateWorkoutTime} from '../helper/parser';
import { Collapsible } from '@/components/Collapsible';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';

import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { router } from 'expo-router';

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

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      // console.log(result);

      if (result.assets) {

        const asset = result.assets[0];

        const contents = await FileSystem.readAsStringAsync(asset.uri);

        const d = CSVStringToJSON(contents);

        setData(d);

        setDay(getDaysIntoYear() % d.length);
        // setDay(23);

        setTitle(asset.name);
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: 
        75 * day
        , animated: true});
    }
  }, [data]);

  return (
    // <ThemedView style={{ }}>
      <Animated.ScrollView style={styles.container} ref={scrollViewRef}>
        {data.length == 0 && <View>
          <ThemedText type="title">{title}</ThemedText>
        </View>} 
        <Button title="Update Workout (Upload CSV)" onPress={pickDocument} />
        {data.length != 0 && <View>
          {data.map((item, index) => {

            let getFontSizeByDay = () => "subtitle";
            let isOnCurrentDay = () => index + 1 == day;

            return <View key={index} style={{position: "relative", paddingTop: 25, borderRadius: 15}}>
              <ThemedView darkColor='rgba(255, 255, 255, 0.15)' lightColor='rgba(0, 0, 0, 0.15)' style={{ height: 1, marginBottom: 25}} />
              {item.routine.length != 0 ? <Collapsible fontType={getFontSizeByDay()} title={item.day + " - " + item.category} open={isOnCurrentDay()}>
                 <ThemedText type='regular' darkColor="rgba(255, 255, 255, 0.7)" lightColor='rgba(0, 0, 0, 0.7)'>
                  {item.routine.length} exercises - {estimateWorkoutTime(item.routine)}
                </ThemedText>

                {/* <Link href="routine" asChild> */}
                <Pressable 
                  style={{ position: "absolute", right: 0, top: -25}} 
                  onPress={() => {
                    router.push("routine");
                    setWorkoutSelected(item);
                  }}
                >
                  <ThemedText type='default' darkColor='rgb(135, 255, 183)' lightColor='rgb(135, 255, 183)'> Start </ThemedText>
                </Pressable>
                {/* </Link> */}

                <View style={{ paddingTop: 5, paddingLeft: 25}}>
                  {item.routine.map((routineItem, index) => {

                    let displayStrArray = displayWorkoutItenaryString(routineItem).split(" ");

                    return <View key={index} style={{ flexDirection: 'column', paddingTop: 5}}>
                      <ThemedText type='regular' style={{ paddingTop: 3}} darkColor="rgba(255, 255, 255, 0.7)" lightColor='rgba(0, 0, 0, 0.7)'>
                        {displayStrArray[0] + " "} 
                      </ThemedText>
                      <ThemedText type='defaultSemiBold' style={{paddingLeft: 0}}>
                        {displayStrArray.slice(1).join(" ")}
                      </ThemedText>
                    </View>
                  })}
                  {/* <Button title={"Start Day " + item.day + " Workout - " + item.category} onPress={() => {}} /> */}
                </View>
              </Collapsible> : <ThemedText type={getFontSizeByDay()} darkColor='rgba(255, 255, 255, 0.5)' lightColor='rgba(0, 0, 0, 0.5)'>{item.day + " - " + item.category}</ThemedText>}
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
    paddingTop: 75
  },
});
