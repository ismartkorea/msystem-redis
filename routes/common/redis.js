/*
 * 모듈명  : redis.js
 * 설명    : redis session db
 * 작성일  : 2023년 10월 16일
 * author  : HiBizNet 
 * copyright : HiBizNet & GaoSystems
 * version : 1.0
 */
const express = require('express');
const dotenv = require('dotenv');
const redis = require('redis');

dotenv.config(); // env환경변수 파일 가져오기

//* Redis 연결
const redisClient = redis.createClient({ legacyMode: true }); // legacy 모드 반드시 설정 !!
redisClient.on('connect', () => {
   console.info('Redis connected!');
});
redisClient.on('error', (err) => {
   console.error('Redis Client Error', err);
});
redisClient.connect().then(); // redis v4 연결 (비동기)
const redisCli = redisClient.v4; // 기본 redisClient 객체는 콜백기반인데 v4버젼은 프로미스 기반이라 사용

module.exports = redisClient;