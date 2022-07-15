import Speedometer, {
  Background,
  Needle,
  Arc,
  Progress,
  Marks,
  Indicator,
} from "react-speedometer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPaw,
  faCheckCircle,
  faSpinner,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { useEffect, useState } from "react";

import { useSpring, useTransition, animated as a } from "react-spring";

const SpeedTest = () => {
  const [started, setStarted] = useState(false);

  const [active, setActive] = useState(false);

  let activeTest = active;

  const [speed, setSpeed] = useState(0);

  const [status, setStatus] = useState({
    text: "Click to start",
    className: "",
    icon: faCheck,
    spin: false,
  });

  const textTransition = useTransition(status, {
    config: {
      friction: 10,
    },
    from: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: -10, config: { clamp: true } },
  });

  const handleSpeedTest = () => {
    setStarted(true);
  };

  const pingServer = async () => {
    setStatus({
      ...status,
      text: "Pinging server...",
      icon: faSpinner,
      spin: true,
    });
    const response = await fetch("ping", { method: "HEAD" });
    if (response.ok) {
      setStatus({
        ...status,
        text: "Pinging server...done",
        icon: faCheckCircle,
        spin: false,
      });
      setActive(true);
      setStatus({
        ...status,
        text: "Testing speed...",
        icon: faSpinner,
        spin: true,
      });
    }
  };

  useEffect(() => {
    if (started) {
      setStatus({
        ...status,
        text: "Started!",
        icon: faCheckCircle,
        className: "text-green-300",
      });
      pingServer();
    }
  }, [started]);

  useEffect(() => {
    let currentSpeed = speed;
    // theoretically, the array can be within our promise, so that it garbage collects after the promise is resolved since it is no longer needed
    // this is why we set bytes to an empty array once our for loop is done
    let bytes = [];
    const testFile = async () => {
      const response = await fetch("download");
      if (response.ok) {
        const stream = response.body.getReader();
        const startTime = new Date().getTime();
        for (let i = 0; i < 5000; i++) {
          const { done, value } = await stream.read();
          try {
            const bps = parseInt(
              (value.byteLength * 8) /
                ((new Date().getTime() - startTime) / 1000).toFixed(2)
            );
            const kbps = parseInt((bps / 1024).toFixed(2));
            const mbps = parseInt((kbps / 1024).toFixed(2));
            currentSpeed = bps;
            if (currentSpeed > 0) {
              bytes.push(currentSpeed);
            }
            let sum = 0;
            for (const i in bytes) {
              sum += bytes[i];
            }

            setSpeed(sum / bytes.length);
            if (done) {
              break;
            }
          } catch {
            break;
          }
        }
        // cancel the stream once we've finished the sample
        await stream.cancel();
        console.log("done!");

        // clear the bytes array for the next sample

        bytes = [];

        setActive(false);

        setStatus({
          ...status,
          text: "Testing speed...done!",
          icon: faCheckCircle,
          spin: false,
          className: "text-green-300",
        });
      }
    };
    if (active) {
      testFile();
    } else {
      let progress = currentSpeed;
      const interval = setInterval(() => {
        console.log(progress);
        if (Math.floor(progress) > 0) {
          setSpeed((progress /= 1.05));
        } else {
          setSpeed(0);
          console.log("ready");
          setStarted(false);
          setStatus({
            text: "Click to start",
            icon: faCheck,
            spin: false,
          });
          clearInterval(interval);
        }
      }, 10);
      return () => clearInterval(interval);
    }
  }, [active]);

  return (
    <>
      <div className="w-full h-full fixed bg-zinc-900">
        <div className="absolute w-[800px] bg-zinc-800 rounded-2xl text-center top-4 p-12 text-zinc-300 m-auto left-0 right-0">
          <p className="text-4xl my-4">very simple speed test uwu</p>
          <p className="text-sm">
            i am not responsible for any{" "}
            <FontAwesomeIcon className="fa-bounce" icon={faPaw} />
          </p>
          <div className="flex justify-center my-14">
            <Speedometer value={speed} max={1000}>
              <Background />
              <Arc />
              <Needle baseOffset={40} />
              <Progress />
              <Marks step={100} />
              <Indicator></Indicator>
            </Speedometer>
          </div>
          <div className="my-12">
            {textTransition((style, i) => (
              <a.p
                className={`text-2xl relative h-0 ${i.className}`}
                style={style}
              >
                {i.icon && (
                  <FontAwesomeIcon
                    className={`mx-2 ${i.spin && "fa-spin"}`}
                    icon={i.icon}
                  />
                )}
                {started ? i.text : "Click to start"}
              </a.p>
            ))}
          </div>
          <button
            onClick={handleSpeedTest}
            className="bg-zinc-700 p-4 rounded-2xl disabled:text-zinc-500"
            disabled={started}
          >
            <FontAwesomeIcon
              className={`mx-2 ${started && "fa-spin"}`}
              icon={started ? faSpinner : faPaw}
            />
            {started ? "Running..." : "Start Test"}
          </button>
        </div>
      </div>
    </>
  );
};

export default SpeedTest;
