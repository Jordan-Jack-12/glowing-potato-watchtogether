# Watch Together App

## Running the App

1. Run the app using `npm run dev`
2. Use Ngrok to deploy it to the internet using `ngrok http --domain=nicely-strong-ferret.ngrok-free.app 3000` command
3. Now Access the website through the ngrok-free domain

## Loading the Media File - Manual work needed

1. Make HLS format for the large video

```
ffmpeg 
```

2. Put those all files in one place inside public  directory of the App. This will contain filename.m3u8, and filename_number.ts files.

3. Then check file path in the HLS code in client side page.

## Further Development

[ ] all buttons of media: <https://github.com/muxinc/media-chrome> , <https://github.com/video-dev/hls.js/>
[ ] configuring all the button function with socket
[ ] socket for reactions
[ ] socket function for number of online.
