/// <reference lib="webworker" />
self.onmessage = async (event) => {
    debugger
    const {verticesData1, verticesData2 } = event.data;
    console.log(verticesData1, verticesData2);
};
