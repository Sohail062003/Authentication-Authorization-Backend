const requests = new Map();

const rateLimiter = (req, res, next) => {

    const ip = req.ip;
    const email = req.body.email.toLowerCase().trim();

    const key = `${ip}:${email}`;

    const currentTime = Date.now();

    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;

    // const client = requests.get(ip);
    const client = requests.get(key);

    console.log("IP:", ip);
    console.log("Email:", email);
    console.log("Key:", key);
    console.log("Client:", requests.get(key));

    if (!client) {

        requests.set(key, {
            count: 1,
            startTime: currentTime
        });

        return next();
    }

    const elapsedTime = currentTime - client.startTime;

    if (elapsedTime > windowMs) {

        requests.set(ip, {
            count: 1,
            startTime: currentTime
        });

        return next();
    }

    if (client.count >= maxRequests) {

        return res.status(429).json({
            status: "failed",
            message: "Too many requests. Please try again later."
        });
    }

    

    client.count++;

    next();
};

export default rateLimiter;