
import { readString } from 'react-native-csv'
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export function CSVStringToJSON(str: string) {

  const data: Array<Array<string>> = readString(str).data;

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
        double: row[6] != "" ? true : false,
      };
      current.routine.push(routineItem);
    }
  });

  return structuredData;
}

export function beautifyTime (timeInSeconds) {
  let minutes = Math.floor(timeInSeconds / 60);
  let seconds = timeInSeconds % 60;

  let str = "";

  if (minutes > 0) {
    str += minutes + "m";
  }

  if (seconds > 0) {
    str += seconds + "s";
  }

  return str;
}

export function speechifyTime (timeInSeconds) {
  return beautifyTime(timeInSeconds).replace("m", " minute").replace("s", " seconds");
}

export function displayWorkoutItenaryString (itenary) {
  let str = "";

  if (itenary.double) {
    str = "[2x] " + str;
  }

  if (itenary.set && itenary.rep) {
    str += itenary.set + "x" + (itenary.rep != -1 ? itenary.rep : "Fail");
  }
  else {
    if (itenary.set) {
      str += itenary.set + "x";
    }
    str += beautifyTime(itenary.time);
  }

  return str + " " + itenary.name;
}

export function estimateWorkoutTime (workout) {
  let time = 0;
  const REST_TIME = 45; // 45s rest time

  workout.forEach((itenary) => {
    if (itenary.set && itenary.rep) {
      if (itenary.rep == -1) {
        time += itenary.set * 60 + itenary.set * REST_TIME; // given 4 seconds per rep
      }
      else {
        time += itenary.set * itenary.rep * 4 + itenary.set * REST_TIME; // given 4 seconds per rep
      }
    }
    else {
      if (itenary.set) {
        time += itenary.set * 4 * itenary.time + itenary.set * REST_TIME; // given 4 seconds per rep
      }
      else {
        time += itenary.time + REST_TIME;
      }
    }
  });

  return beautifyTime(time).split("m")[0] + " minutes";
}

//saves and loads of data

export const makeSaveURI = (workoutName) => {
  return FileSystem.documentDirectory + "Logs_" + workoutName + ".csv"
}

export const getWorkoutSaveURIIfExistsOrMakeNew = async (uri) => {
  const file = await FileSystem.getInfoAsync(uri);

  if (!file.exists) {
    await FileSystem.writeAsStringAsync(uri, "Timestamp, Numerical Data, String");
  }

  // await FileSystem.writeAsStringAsync(uri, "Timestamp, Numerical Data, String");

  return file.uri;
}

export const updateWorkoutDataToSave = async (itenary, data) => {
  let contents = await FileSystem.readAsStringAsync(
    await getWorkoutSaveURIIfExistsOrMakeNew(makeSaveURI(itenary.name))
  );

  const time = new Date().getTime();
  contents += "\n" + time + ", " + data + ", " + displayWorkoutItenaryString(itenary).split(" ")[0];

  await FileSystem.writeAsStringAsync(
    makeSaveURI(itenary.name),
    contents
  );
}

export const deleteLastDataPointFromSave = async (itenary) => {
  let contents = await FileSystem.readAsStringAsync(
    await getWorkoutSaveURIIfExistsOrMakeNew(makeSaveURI(itenary.name))
  );

  const data = CSVStringToJSONForSaves(contents);

  data.pop();

  let newContents = "Timestamp, Numerical Data, String";
  data.forEach((row) => {
    newContents += "\n" + row.timeStamp + ", " + row.num + ", " + row.string;
  });

  await FileSystem.writeAsStringAsync(
    makeSaveURI(itenary.name),
    newContents
  );
}

export const getWorkoutDataFromSave = async (itenary) => {
  const contents = await FileSystem.readAsStringAsync(
    await getWorkoutSaveURIIfExistsOrMakeNew(makeSaveURI(itenary.name))
  );

  return CSVStringToJSONForSaves(contents);
} 

const CSVStringToJSONForSaves = (str: string) => {
  //format is timestamp, numerical data, string data
  const data: Array<Array<string>> = readString(str).data;
  const structuredData : Array<Map<string, number>> = [];

  try{
    data.forEach((row: Array<string>, index: number) => {
      if (index === 0) { return; } //1st row declared as header

      const current = {
        timeStamp: parseFloat(row[0]),
        num: parseFloat(row[1]),
      }

      structuredData.push(current);
    });
  }
  catch (e) {
    Alert.alert("Error parsing logfile", e);
    return [];
  }

  return structuredData;
}

export const pruneLogs = async () => {
  const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);

  files.forEach(async (file) => {
    if (file.includes("Logs")) {
      console.log(file);
      console.log("deleting")
    
      FileSystem.deleteAsync(FileSystem.documentDirectory + file);
    }
  });

  Alert.alert("Logs pruned");
}

export const pruneLog = async (itenary) => {
  await FileSystem.deleteAsync(makeSaveURI(itenary.name));
  Alert.alert(itenary.name + " log pruned");
}


export const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
    });

    if (result.assets) {
      const asset = result.assets[0];
      return asset;
    }
  } catch (err) {
    Alert.alert("Error picking files", err.message);
  }

  return null;
};

export const importDataToSave = async (itenary) => {
  let data = await pickDocument();

  const content = await FileSystem.readAsStringAsync(data.uri);

  // make sure first and second column of every row after first is numerical
  CSVStringToJSONForSaves(content)

  await FileSystem.writeAsStringAsync(
    makeSaveURI(itenary.name),
    content
  );
}