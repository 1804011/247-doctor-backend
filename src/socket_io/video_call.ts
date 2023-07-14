
module.exports =async  function(socket:any,io:any) {

    socket.on('join_room',async  function({room_id,user_id,remote_media_stream}:{room_id:string,user_id:string,remote_media_stream:any}) {
         socket.join(room_id);
          io.to(room_id).emit("participant_joined_room",{user_id,remote_media_stream})
    }); 
      

     
    socket.on("participant_joined_room",(user_id:string)=>{
        console.log("participant joined,",user_id) 
    })
  };  