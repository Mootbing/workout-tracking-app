
import { readString } from 'react-native-csv'

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

  // console.log(structuredData)

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