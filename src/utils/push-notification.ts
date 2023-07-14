import https from "https";

const api_key = process.env.ONE_SIGNAL_API_KEY;
console.log(api_key);

export const sendNotification = async (data: any, callback: any) => {
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${api_key}`,
    };

    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers,
    };

    var request = https.request(options, function (response: any) {
        var responseData = "";

        response.on("data", function (chunk: any) {
            responseData += chunk;
        });

        response.on("end", function () {
            console.log("Response Data:", responseData);
            try {
                var parsedData = JSON.parse(responseData);
                return callback(null, parsedData);
            } catch (error) {
                console.error("Error parsing JSON:", error);
                return callback(error, null);
            }
        });
    });

    request.on("error", function (error: any) {
        console.error("Request error:", error);
        return callback(error, null);
    });

    request.write(JSON.stringify(data));
    request.end();
};
