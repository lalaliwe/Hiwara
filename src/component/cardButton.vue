<script setup lang="ts">
import notImg from '../static/img/not-img.jpg';
import test1Img from '../static/img/test1.jpg';

const props = defineProps({
  grid: {
    type: String,
    default: '1'
  }
})
</script>

<template>
  <div class="card">
    <v-card v-ripple>
      <v-img height="140px" :src="test1Img" cover>
        <div class="info1">
          <div></div>
          <div class="isR18">
            <span>
              R-18
            </span>
          </div>
          <div class="viewNum">
            <span>
              <font-awesome-icon icon="fa-regular fa-circle-play" />100
            </span>
            &nbsp;
            <span>
              <font-awesome-icon icon="fa-regular fa-heart" />100
            </span>
          </div>
          <div class="contentNum">
            <span>
              12:00
            </span>
          </div>
        </div>
      </v-img>
      <v-card-item class="title">
        <v-card-title>
          这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题
        </v-card-title>
      </v-card-item>
      <v-card-item class="info2">
        <div class="content">
          <div class="author">
            <font-awesome-icon icon="fa-regular fa-user" />用户XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          </div>
          <div class="time">
            2022-01-01
          </div>
        </div>

      </v-card-item>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
.card {
  padding: 5px;
}

.info1 {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);


  .isR18 {
    display: flex;
    justify-content: flex-end;
    align-items: start;
    padding: 6px;

    span {
      display: inline-block;
      background: #ff3c00b0;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      font-size: 0.6rem;
      font-weight: bold;
      padding: 1px 4px;
      color: #fff;
      font-family: sans-serif;
    }
  }

  .viewNum {
    display: flex;
    justify-content: flex-start;
    align-items: end;
    padding: 6px;

    span {
      display: inline-block;
      font-size: 0.7rem;
      color: #fff;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }
  }

  .contentNum {
    display: flex;
    justify-content: flex-end;
    align-items: end;
    padding: 6px;

    span {
      display: inline-block;
      font-size: 0.7rem;
      color: #fff;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }
  }
}

.title {
  padding: 0.4rem 0.625rem;

  .v-card-title {
    font-size: 1rem;
  }
}

.info2 {
  padding: 0rem 0.625rem 0.4rem 0.625rem;
  font-size: 0.8rem;

  .content {
    display: grid;
    grid-template-columns: repeat(2, 50%);
    div{
      color: #616161;
      font-size: 0.8rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
    div:nth-child(2){
      text-align: right;
    }
  }
}
</style>