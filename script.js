import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from 'dat.gui';

// Wait for the DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#render-context');
    const state = {
        color: null,        // State variable for storing the selected color
        texture: null,      // State variable for storing the selected texture
        models: new Map(),  // State variable Map for storing loaded 3D models
        name: '',           // State variable for storing the name of the currently selected model
    };

    // Log any errors that occur while loading a model
    function logError(error) {
        console.error('An error occurred while loading the model:', error);
    }

    // Extract the URL from a CSS background-image property string
    function extractUrl(str) {
        const urlMatch = str.match(/url\("(.*?)"\)/);
        return urlMatch && urlMatch[1] ? urlMatch[1] : null;
    }

    // Add the loaded model to the scene and update its appearance
    function setModel(gltf, name) {
        state.models.set(name, gltf);
        scene.add(gltf.scene);
        gltf.scene.visible = false;

        updateModelColor(gltf.scene, state.color);
        updateModelTexture(gltf.scene, state.texture);
        animate();
    }

    // Update the model's appearance based on the selected style
    function updateModel(event) {
        const style = window.getComputedStyle(event.target);
        if (style.backgroundImage !== 'none') {
            state.texture = style.backgroundImage;
            state.color = null;
            updateModelTexture(state.models.get(state.name), extractUrl(state.texture));
        } else {
            state.color = style.backgroundColor;
            state.texture = null;
            updateModelColor(state.models.get(state.name), new THREE.Color(state.color));
        }
    }

    // swap the model based on the selected option
    function swapModel(event) {
        state.models.forEach((model, key) => {
            const value = event.target.dataset.model;

            if (key === value) {
                model.scene.visible = true;
            }
            else {
                model.scene.visible = false;
            }

            // Adjust camera position for a better view
            if (value === 'mclaren') {
                camera.position.set(0, 3, 3);

                // Set min and max distance for zoom
                controls.minDistance = 5;
                controls.maxDistance = 30;
            }
            else if (value === 'porsche') {
                camera.position.set(0, 15, 15);

                // Set min and max distance for zoom
                controls.minDistance = 20;
                controls.maxDistance = 50;
            }

            camera.lookAt(0, 0, 0);
            state.name = value;
        });
    }

    // Update the color of the model
    function updateModelColor(model, color = null) {
        if (color) {
            model.scene.traverse(child => {
                if (child.isMesh) {
                    child.material.map = null;
                    child.material.color.set(color);
                }
            });
        }
    }

    // Update the texture of the model
    function updateModelTexture(model, textureURL = null) {
        const textureLoader = new THREE.TextureLoader();

        if (textureURL) {
            textureLoader.load(textureURL, (texture) => {
                model.scene.traverse(child => {
                    if (child.isMesh) {
                        child.material.map = texture;
                        child.material.needsUpdate = true;
                    }
                });
            });
        }
    }

    // Define the animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // prevent camera from going under the plane
        if (camera.position.y < 1) {
            camera.position.y = 1;
        }

        renderer.render(scene, camera);
    }

    // Add event listeners to the color swatches
    document.querySelectorAll('.color-swatch').forEach((swatch) => {
        swatch.addEventListener('click', updateModel);
    });

    document.querySelectorAll('.model-option').forEach((option) => {
        option.addEventListener('click', swapModel);
    });

    // Create a new Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x63c5da);

    // Create a perspective camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Create and attach renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Create orbit controls for the camera
    const controls = new OrbitControls(camera, renderer.domElement);

    // Create and attach directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 1, 0).normalize();
    scene.add(directionalLight);

    // Create and attach ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Create and attach plane
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshBasicMaterial({ color: 0x9897a8, side: THREE.DoubleSide }),
    );
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);

    // Create a GLTFLoader for loading models and load models
    const modelLoader = new GLTFLoader();
    modelLoader.load('https://hadi-rgb.github.io/viewerbucket/models/mclaren.glb', (gltf) => setModel(gltf, 'mclaren'), undefined, logError);
    // modelLoader.load('https://hadi-rgb.github.io/viewerbucket/models/mercedes.glb', (gltf) => setModel(gltf, 'mercedes'), undefined, logError);
    modelLoader.load('https://hadi-rgb.github.io/viewerbucket/models/porsche.glb', (gltf) => setModel(gltf, 'porsche'), undefined, logError);

    // Handle window resize events
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate(); // Start the animation loop

});

// Render default model after JS has loaded
setTimeout(() => {
    document.querySelector('#model-mclaren').click();
}, 1000);
