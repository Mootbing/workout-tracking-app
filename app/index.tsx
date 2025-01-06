import { Image, StyleSheet, Platform, ScrollView, View, Button, Text, StatusBar } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

import { readString } from 'react-native-csv'
import { Collapsible } from '@/components/Collapsible';

function CSVToJSON(data: Array<Array<string>>) {
  const structuredData : Array<Map<string, string>> = [];
  let current = null;

  data.forEach((row: Array<string>, index: number) => {

    if (index === 0) { return; } //1st row declared as header

    if (!isNaN(parseInt(row[0]))) {

      if (current != null) {
        structuredData.push(current);
      }

      current = {
        day: parseInt(row[0]),
        category: row[1].trim(),
        routine: [],
      }
    }
    else if (current != null && row[2]) {
      const routineItem = {
        name: row[2].trim(),
        set: parseInt(row[3]) || null,
        rep: parseInt(row[4]) || null,
        time: parseInt(row[5]) || null,
        double: row[5] != "" ? true : false,
      };
      current.routine.push(routineItem);
    }
  });

  console.log(structuredData)

  return structuredData;
}

export default function Index() {
  const [data, setData] = useState([]);
  const [title, setTitle] = useState("Workout Tracker");

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      console.log(result);

      if (result.assets) {

        const asset = result.assets[0];

        const contents = await FileSystem.readAsStringAsync(asset.uri);
       
        const parsed = readString(contents);

        setData(CSVToJSON(parsed.data));
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <ThemedView>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">{title}</ThemedText>
        </ThemedView>
        <Button title="Update Workout (Upload CSV)" onPress={pickDocument} />
        {data.length != 0 && <View>
          {data.map((item, index) => {
            console.log(item)
            return <View key={index}>
              <Collapsible title={item.day + " - " + item.category}>
                <ThemedText type='regular'>{item.routine.length}</ThemedText>
              </Collapsible>
            </View>
          })}
        </View>}
        {/* Render your data here */}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    padding: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
