const supabase = require("./db.js");
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });

function InitRealtime(io) {
    console.log("realtime initialised")

    supabase.channel("public:messages")
    .on("postgres_changes", {event:'INSERT', schema:'public', table:'messages'}, 
        (payload) => { //output from tracking
            console.log("new insert", payload.new);
            io.emit("newMessage", payload.new); //broadcast
        }
    )
    .subscribe();

    io.on("connection", (socket)=>{
        console.log("Client Connected", socket.id);
        socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
    });
};

module.exports = InitRealtime;
