const controller = new AbortController();

fetch("https://api.example.com/data", { signal: controller.signal })
  .then((res) => res.json())
  .then((data) => console.log(data, "data"))
  .catch((err) => {
    // console.log(err, "err");
    if (err.name === "AbortError") {
      console.log("Request was cancelled");
    } else {
      console.log("Error", err);
    }
  });

controller.abort();
