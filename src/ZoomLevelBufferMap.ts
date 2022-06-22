interface ZoomLevelBufferMap {
    zoomLevel: number,
    bufferSize: number,
    visible: boolean
}

const bufferMap: ZoomLevelBufferMap[] = [
    {
        zoomLevel: 6,
        bufferSize: 40000,
        visible: true
    },
    {
        zoomLevel: 7,
        bufferSize: 10000,
        visible: false
    },
    {
        zoomLevel: 8,
        bufferSize: 12500,
        visible: false
    },
    {
        zoomLevel: 9,
        bufferSize: 5000,
        visible: false
    },
    {
        zoomLevel: 10,
        bufferSize: 4000,
        visible: false
    },
    {
        zoomLevel: 11,
        bufferSize: 3250,
        visible: false
    },
]

export default bufferMap;