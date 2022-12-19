<script setup>
import * as tmPose from "@teachablemachine/pose";
import { ref } from "vue";

const isStart = ref(false);
let slouch = ref(0);
let notSlouch = ref(0);

let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
  const modelURL = "../../public/models/model.json";
  const metadataURL = "../../public/models/metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const size = 400;
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
  try {
    await webcam.setup(); // request access to the webcam
    isStart.value = true;
  } catch (e) {
    alert("請重新點及");
  }

  await webcam.play();
  window.requestAnimationFrame(loop);

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = size;
  canvas.height = size;
  ctx = canvas.getContext("2d");
}

async function loop(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  // Prediction 2: run input through teachable machine classification model
  const prediction = await model.predict(posenetOutput);

  slouch.value = prediction[0].probability.toFixed(2);
  notSlouch.value = prediction[1].probability.toFixed(2);

  drawPose(pose);
}

function drawPose(pose) {
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }
}
</script>

<template>
  <div class="flex items-center flex-col">
    <h1 class="text-2xl">坐姿偵測</h1>

    <div v-if="!isStart" class="flex items-center flex-col">
      <el-button type="primary" size="large" @click="init()"
        >開始判斷</el-button
      >
      <img style="width: 40rem; height: 100%" src="../assets/banner.png" />
      <p>請將攝像機斜放以獲得準確體驗</p>
    </div>

    <div v-else class="flex items-center flex-col">
      <div class="border flex"><canvas id="canvas"></canvas></div>
      {{ slouch }}
      {{ notSlouch }}
    </div>
  </div>
</template>

<style scoped>
/*card 本身會有過大的padding 將其消除*/
.el-card:deep() .el-card__header {
  padding: 0.5rem;
}
</style>
