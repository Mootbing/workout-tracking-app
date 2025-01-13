import { Animated, Image, StyleSheet, Platform, ScrollView, View, Button, Text, StatusBar, Pressable, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useContext, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';

import { CSVStringToJSON, displayWorkoutItenaryString, estimateWorkoutTime, getAllGraphs, pickDocument, pruneLogs } from '../helper/parser';
import { Collapsible } from '@/components/Collapsible';
import { WorkoutSelectedContext } from '@/hooks/useWorkoutSelectedContext';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';

function getDaysIntoYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear;
}

export default function Index() {
  const [day, setDay] = useState(1);//retrieve from localstorage later

  const [data, setData] = useState([]);
  const [title, setTitle] = useState("Workout Tracker");

  const [peekAll, setPeekAll] = useState(false);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [workoutSelected, setWorkoutSelected] = useContext(WorkoutSelectedContext);

  const [showAllGraphs, setShowAllGraphs] = useState(false);
  const [graphs, setGraphs] = useState([]);
  const navigation = useNavigation();

  const setDataFromAsset = async (asset) => {
    const contents = await FileSystem.readAsStringAsync(asset.uri);
    const d = CSVStringToJSON(contents);

    setData(d);

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
          73.5 * day + 165
        , animated: true
      });
    }
  }, [data]);

  let fetchFile = async () => {
    try {
      const value = await AsyncStorage.getItem('last-file');
      if (value !== null) {
        setDataFromAsset(JSON.parse(value));
      }
      const day = await AsyncStorage.getItem('day-streak');
      if (day !== null) {
        setDay(parseInt(day));
      }
    } catch (e) {
      // error reading value
    }
  }

  useEffect(() => {
    fetchFile();
  }, [])

  useEffect(() => {
    if (showAllGraphs) {
      // somehow backwards
      return;
    }

    getAllGraphs().then((graphsData) => {
      // Filter out undefined entries and format the data
      let formattedGraphData = graphsData
        .filter((graph): graph is {name: string, data: Array<{timeStamp: number, num: number}>} => {
          return graph !== undefined && graph.data !== undefined;
        })
        .map((graph) => {
          return {
            name: graph.name,
            data: graph.data.slice(-7).map((item) => {
              const date = new Date(item.timeStamp)
                .toLocaleDateString()
                .split("/")
                .slice(0, 2)
                .join("/");

              return {
                value: item.num,
                dataPointText: item.num.toString(),
                label: date
              }
            })
          }
        });

      console.log(formattedGraphData);
      setGraphs(formattedGraphData);
    });
  }, [showAllGraphs]);

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
          <ThemedText type="default" darkColor='rgb(255, 130, 130)' lightColor='rgb(255, 130, 130)'>Upload Workout CSV</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "Reset Day Counter",
            "Are you sure you want to reset workout counter?",
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
              },
              {
                text: "OK", onPress: async () => {
                  setDay(1);
                  try {
                    await AsyncStorage.setItem('day-streak', "1");
                  } catch (e) {
                    // saving error
                  }
                },
                style: "destructive"
              }
            ]
          );
        }}>
          <ThemedText type="default" darkColor='rgb(255, 130, 130)' lightColor='rgb(255, 130, 130)'>Reset Day Counter</ThemedText>
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
                },
                style: "destructive"
              }
            ]
          );
        }}>
          <ThemedText type="default" darkColor='rgb(255, 130, 130)' lightColor='rgb(255, 130, 130)'>Prune Saved Logs</ThemedText>
        </TouchableOpacity>
        {data.length != 0 && <TouchableOpacity onPress={() => {
          setPeekAll(!peekAll);
        }}>
          <ThemedText type="default" darkColor='rgb(255, 255, 255)' lightColor='rgb(255, 255, 255)'>{!peekAll ? "Reveal" : "Hide"} All</ThemedText>
        </TouchableOpacity>}
        <TouchableOpacity onPress={() => {
          setShowAllGraphs(!showAllGraphs);
        }}>
          <ThemedText type="default" darkColor='rgb(255, 255, 255)' lightColor='rgb(255, 255, 255)'>Show Progression Graphs</ThemedText>
        </TouchableOpacity>
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
      <Modal
        visible={showAllGraphs}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAllGraphs(false);
        }}
      >
        <BlurView intensity={25} style={{ padding: 25, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)"}}>
          <View style={{marginTop: 40}}>
            <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%"}}>
              <ThemedText type="title">All Graphs</ThemedText>
              <TouchableOpacity onPress={() => {
                setShowAllGraphs(false);
              }}>
                <ThemedText type="default" darkColor='rgb(255, 130, 130)' lightColor='rgb(255, 130, 130)'>Close</ThemedText>
              </TouchableOpacity>
            </View>
            {graphs.length > 0 ? <ScrollView>
              {graphs.map((graph) => {

                if (graph.data.length == 0) {
                  return null;
                }

                return <View key={graph.name} style={{paddingTop: 25}}>
                  <ThemedText type="subtitle" style={{fontWeight: 300}}>{graph.name.toLowerCase()}</ThemedText>
                  <LineChart

                        areaChart
                        startFillColor="rgb(255, 255, 255)"
                        startOpacity={0.15}
                        endFillColor="rgb(255, 255, 255)"
                        endOpacity={0}

                        spacing={(Dimensions.get("window").width - 100) / graph.data.length}

                        width={Dimensions.get("window").width - 100}
                        data={
                          graph.data
                        }
                        thickness={2}
                        
                        curved
                        // hideOrigin

                        dataPointsColor='rgba(255, 255, 255, 0.7)'

                        textShiftX={10}
                        textShiftY={0}
                        textColor='rgba(255, 255, 255, 1)'
                        noOfSections={5}

                        // initialSpacing={0}

                        xAxisType='dashed'

                        xAxisLabelTextStyle={{
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: 12
                        }}
                        rulesColor={"rgba(255, 255, 255, 0.2)"}
                        
                        xAxisColor={"rgba(255, 255, 255, 0.2)"}
                        yAxisColor="rgba(255, 255, 255, 0)"
                        yAxisTextStyle={{
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: 12
                        }}

                        yAxisOffset={graph.data.map((item) => item.value).reduce((a, b) => Math.min(a, b), 1e9) - 5}
                        // yAxisExtraHeight={20}

                        verticalLinesStrokeDashArray={[5, 5]}
                        showVerticalLines
                        verticalLinesColor="rgba(255,255,255,0.2)"
                        color="rgba(255, 255, 255, 0.25)"
                    />
                </View>
              })}
              <View style={{height: 50}} />
            </ScrollView> : <ThemedText type="default" style={{color: "rgba(255, 255, 255, 0.5)", marginTop: 10}}>No graphs found. Log numerical resuls (eg. weights / time) to see graphs.</ThemedText>}
          </View>
        </BlurView>
      </Modal>
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
