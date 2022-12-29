<script setup>
import { ElMessage } from "element-plus";
import * as tmPose from "@teachablemachine/pose";
import { ref } from "vue";

const isStart = ref(false);
let slouch = ref(0);
let isSlouch = ref(false);
let slouchCounter = ref(0);

let notSlouch = ref(0);
let isNotSlouch = ref(false);
let notSlouchCounter = ref(0);

let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
  const modelURL = "./models/model.json";
  const metadataURL = "./models/metadata.json";

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
    cameraWarning();
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

  if (slouch.value > 0.9) {
    slouchCounter.value++;
  } else {
    slouchCounter.value = 0;
  }

  if (notSlouch.value > 0.9) {
    notSlouchCounter.value++;
  } else {
    notSlouchCounter.value = 0;
  }

  if (slouchCounter.value > 30) {
    isSlouch.value = true;
  } else {
    isSlouch.value = false;
  }

  if (notSlouchCounter.value > 30) {
    isNotSlouch.value = true;
  } else {
    isNotSlouch.value = false;
  }
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

const cameraWarning = () => {
  ElMessage({
    message: "請允許攝影機開放或選擇正確的來源 !",
    type: "warning",
  });
};
</script>

<template>
  <div
    class="flex items-center flex-col h-screen p-8"
    :class="{ 'bg-red-500': isSlouch, 'bg-green-500': isNotSlouch }"
  >
    <h1 class="text-3xl mb-6">坐姿偵測</h1>

    <div v-if="!isStart" class="flex items-center flex-col">
      <el-button type="primary" size="large" @click="init()" class="mb-8">
        開始判斷
      </el-button>
      <img style="width: 40rem; height: 100%" src="../assets/banner.png" />
      <p class="text-2xl mt-8">請將攝像機以側面拍攝以獲得準確體驗</p>
    </div>

    <div v-else class="flex items-center flex-col">
      <div class="border flex"><canvas id="canvas"></canvas></div>
      駝背 : {{ slouch }} 坐正 : {{ notSlouch }}
    </div>
  </div>
</template>

<style scoped>
/*card 本身會有過大的padding 將其消除*/
.el-card:deep() .el-card__header {
  padding: 0.5rem;
}
</style>
