import moment from 'moment-timezone';
export const convertUtcToOthersDateTime =(utcdate:string,timezone:string)=>{

if(utcdate===undefined || timezone===undefined){
return "Invalid Date/Time";
}
  let utcMoment = moment.utc(utcdate);
  let localMoment = moment.tz(utcMoment,timezone);
  
  // Adjust for standard time (STD) offset 
  if (localMoment.isDST()) {
    localMoment.subtract(1, 'hours');
  }
  
  let formattedDate = localMoment.format('YYYY-MM-DD HH:mm:ss');
  return formattedDate;

}


export const convertUtcDateTimeToOnlyDate =(utcdate:string,timezone:string)=>{
    if(utcdate===undefined || timezone===undefined){
        return "Invalid Date/Time";
        }
        
     let date=convertUtcToOthersDateTime(utcdate,timezone);
     
     const dateObj = new Date(date);
     const year = dateObj.getFullYear();
     const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
     const day = dateObj.getDate().toString().padStart(2, "0");
     const formattedDate = `${year}-${month}-${day}`;
      return formattedDate;

}

export const convertUtcDateTimeToOnlyTime =(utcdate:string,timezone:string)=>{
    if(utcdate===undefined || timezone===undefined){
        return "Invalid Date/Time";
        }
        
     let dateTimeString=convertUtcToOthersDateTime(utcdate,timezone);
     
     const date = new Date(dateTimeString);
     const utcTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
     console.log(utcTime);
     
     return utcTime;

}


export const convertOthersToUtcDateTime = (date: string, time: string, timezoneOffset: string) => {
    if (date === undefined || time === undefined || timezoneOffset === undefined) {
      return "Invalid Date/Time";
    }
    time = time.replace(" ", ":");
    const timeParts = time.split(":");
   
    
    let hours = parseInt(timeParts[0]);
    let minutes = parseInt(timeParts[1].substr(0, 2));
    const isPm = timeParts[2]=== "PM"||timeParts[2]=== "pm"||timeParts[2]=== "Pm"||timeParts[2]=== "pM";
    console.log(isPm);
    
    if (isPm && hours < 12) {
      hours += 12;
    } else if (!isPm && hours === 12) {
     
      hours = 0;
    }
    time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    console.log(time);
    const dateTimeString = `${date}T${time}:00.000${timezoneOffset}`;
    console.log(dateTimeString);
    const utcDateTimeString = new Date(dateTimeString).toUTCString();
    const utcDateObject = new Date(utcDateTimeString);
    const utcDateString = utcDateObject.toISOString();
    console.log(utcDateString);
    
    return utcDateString;
  };

export const convertOthersToUtcTime =(time:string,timezoneOffset:string)=>{

    if(time===undefined || timezoneOffset===undefined){
    return "Invalid Date/Time";
    }
    
    const dateTimeString = `05-01-2023T${time}:00.000${timezoneOffset}`;
    const utcDateTimeString = new Date(dateTimeString).toLocaleTimeString();
    return utcDateTimeString;

    
}
    