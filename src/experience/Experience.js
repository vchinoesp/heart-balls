import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Sizes from './Sizes';
import Time from './Time';
import Camera from './Camera';
import Renderer from './Renderer';

import Debug from '../utils/Debug';
import Heart from '../world/Heart';
//import Balls from '../world/Balls';
//import HeartBalls from '../world/HeartBalls';
//import HeartSurfacePoints from '../world/HeartSurfacePoints';
import HeartPackedBalls from '../world/HeartPackedBalls';


export default class Experience {
    constructor() {
        window.experience = this;

        this.canvas =
            document.querySelector(
                '.webgl'
            );

        this.scene =
            new THREE.Scene();

        this.debug =
            new Debug();

        this.sizes =
            new Sizes();

        this.time =
            new Time();

        this.camera =
            new Camera(
                this.sizes,
                this.scene,
                this.debug
            );

        this.renderer =
            new Renderer(
                this.canvas,
                this.sizes,
                this.scene,
                this.camera
            );

        this.setLights();

        this.controls =
            new OrbitControls(
                this.camera.instance,
                this.canvas
            );

        this.controls.enableDamping =
            true;

        this.controls.dampingFactor =
            0.05;

        this.heart = new Heart(
                this.scene,
                this.debug
            );
        this.debugConfig = {
            showHeart: true,
            /*showPoints: true,
            showBalls: false*/
        };

        this.heartPackedBalls =
            new HeartPackedBalls(
                this.scene,
                this.heart,
                this.debug,
                this.debugConfig
            );


        /*this.heartSurfacePoints =
            new HeartSurfacePoints(
                this.scene,
                this.heart,
                this.debug,
                this.debugConfig
            );*/

        /*this.heartBalls =
            new HeartBalls(
                this.scene,
                this.heart,
                this.debug,
                this.debugConfig
            );*/
/*
        this.balls =
            new Balls(
                this.scene
            );*/

        window.addEventListener(
            'sizes:resize',
            () => {
                this.resize();
            }
        );

        window.addEventListener(
            'time:tick',
            () => {
                this.update();
            }
        );
    }

    setLights() {

        this.ambientLight =
            new THREE.AmbientLight(
                0xffffff,
                0.6
            );

        this.scene.add(
            this.ambientLight
        );

        this.keyLight =
            new THREE.DirectionalLight(
                0xffffff,
                4
            );

        this.keyLight.position.set(
            -10,
            10,
            10
        );

        this.scene.add(
            this.keyLight
        );

        this.fillLight =
            new THREE.DirectionalLight(
                0xfff5e8,
                1.5
            );

        this.fillLight.position.set(
            5,
            2,
            8
        );

        this.scene.add(
            this.fillLight
        );

        this.rimLight =
            new THREE.DirectionalLight(
                0xffffff,
                1
            );

        this.rimLight.position.set(
            10,
            5,
            -10
        );

        this.scene.add(
            this.rimLight
        );
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        this.controls.update();

        this.heart.update();
        //this.balls.update();
        //this.heartBalls.update();
        //this.heartSurfacePoints.update();
        this.heartPackedBalls.update();
        this.renderer.update();

    }
}