// Import Firebase modules
 import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
 import { getFirestore, collection,
addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from
"https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
 import { getStorage, ref,
uploadBytes, getDownloadURL, deleteObject } from
"https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
 
 // Firebase configuration
 const firebaseConfig = {
 apiKey:
"AIzaSyB4MhBZMMkoP_nIWUa5dnCi5MVRxf1EE5k",
 authDomain:
"san-pablo-basquetbol.firebaseapp.com",
 projectId:
"san-pablo-basquetbol",
 storageBucket:
"san-pablo-basquetbol.firebasestorage.app",
 messagingSenderId:
"282938518041",
 appId:
"1:282938518041:web:b393fe32e390ed073b1888"
 };
 
 // Initialize Firebase
 const app =
initializeApp(firebaseConfig);
 const db = getFirestore(app);
 const storage = getStorage(app);
 
 // Make Firebase available globally
 window.db = db;
 window.storage = storage;
 window.firebaseModules = {
 collection, addDoc, getDocs,
doc, updateDoc, deleteDoc, query, orderBy, onSnapshot,
 ref, uploadBytes,
getDownloadURL, deleteObject
 };
 
 // Initialize app after Firebase is
ready
 window.initializeApp();
 


 // Global variables
 let currentCategory = '';
 let imageGalleries = {
 'liga-este': [],
 'veteranos-50': [],
 'veteranos-35': [],
 'comienzos': [],
 'formativas': [],
 'club-general': []
 };
 
 let newsArticles = [];
 let currentNewsImage = null;
 let heroBackgroundImage = null;
 let matches = [];
 let currentSanPabloShield = null;
 let currentRivalShield = null;
 
 // Authentication
 const ADMIN_PASSWORD =
'sanpablo2024';
 let isAuthenticated = false;
 let authTimeout = null;
 
 // Initialize app
 window.initializeApp = async
function() {
 try {
 // Load all data from
Firebase
 await Promise.all([
 loadGalleries(),
 loadNews(),
 loadMatches(),
 loadSchedule(),
 loadHeroBackground()
 ]);
 
 // Hide loading overlay

document.getElementById('loading-overlay').style.display = 'none';
 
 // Setup real-time
listeners
 setupRealtimeListeners();
 
 console.log('App
initialized successfully');
 } catch (error) {
 console.error('Error initializing app:',
error);
 showMessage('Error al cargar los datos.
Intenta recargar la pgina.', 'error');
 document.getElementById('loading-overlay').style.display
= 'none';
 }
 };
 
 // Setup real-time listeners
 function setupRealtimeListeners() {
 const { onSnapshot, collection,
query, orderBy } = window.firebaseModules;
 
 // Listen for news changes

onSnapshot(query(collection(window.db, 'news'), orderBy('timestamp', 'desc')),
(snapshot) => {
 newsArticles =
snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data()
 }));
 displayNews();
 });
 
 // Listen for matches changes

onSnapshot(query(collection(window.db, 'matches'), orderBy('timestamp',
'desc')), (snapshot) => {
 matches =
snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data()
 }));
 displayMatches();
 });
 }
 
 // Firebase Storage functions
 async function
uploadImageToFirebase(file, path) {
 try {
 const { ref, uploadBytes,
getDownloadURL } = window.firebaseModules;
 const imageRef =
ref(window.storage, path);
 const snapshot = await
uploadBytes(imageRef, file);
 return await
getDownloadURL(snapshot.ref);
 } catch (error) {
 console.error('Error uploading image:',
error);
 throw error;
 }
 }
 
 async function
deleteImageFromFirebase(url) {
 try {
 const { ref, deleteObject }
= window.firebaseModules;
 const imageRef =
ref(window.storage, url);
 await
deleteObject(imageRef);
 } catch (error) {
 console.error('Error
deleting image:', error);
 }
 }
 
 // Firestore functions
 async function
saveToFirestore(collectionName, data) {
 try {
 const { collection, addDoc
} = window.firebaseModules;
 const docRef = await
addDoc(collection(window.db, collectionName), data);
 return docRef.id;
 } catch (error) {
 console.error('Error saving
to Firestore:', error);
 throw error;
 }
 }
 
 async function
updateFirestore(collectionName, docId, data) {
 try {
 const { doc, updateDoc } =
window.firebaseModules;
 await
updateDoc(doc(window.db, collectionName, docId), data);
 } catch (error) {
 console.error('Error
updating Firestore:', error);
 throw error;
 }
 }
 
 async function
deleteFromFirestore(collectionName, docId) {
 try {
 const { doc, deleteDoc } =
window.firebaseModules;
 await
deleteDoc(doc(window.db, collectionName, docId));
 } catch (error) {
 console.error('Error
deleting from Firestore:', error);
 throw error;
 }
 }
 
 async function
loadFromFirestore(collectionName) {
 try {
 const { collection,
getDocs, query, orderBy } = window.firebaseModules;
 const q =
query(collection(window.db, collectionName), orderBy('timestamp', 'desc'));
 const querySnapshot = await
getDocs(q);
 return
querySnapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data()
 }));
 } catch (error) {
 console.error('Error
loading from Firestore:', error);
 return [];
 }
 }
 
 // Gallery functions with Firebase
 async function loadGalleries() {
 try {
 const galleries = await
loadFromFirestore('galleries');
 galleries.forEach(gallery
=> {
 if
(imageGalleries[gallery.category]) {

imageGalleries[gallery.category] = gallery.images || [];
 }
 });
 

Object.keys(imageGalleries).forEach(category => {

displayImages(category);
 });
 updateAllCounts();
 } catch (error) {
 console.error('Error
loading galleries:', error);
 }
 }
 
 async function saveGalleries() {
 try {
 for (const [category,
images] of Object.entries(imageGalleries)) {
 const galleryData = {
 category: category,
 images: images,
 timestamp: new
Date().toISOString()
 };
 
 // Check if gallery
exists
 const { collection,
getDocs, query, where } = window.firebaseModules;
 const q =
query(collection(window.db, 'galleries'), where('category', '==', category));
 const querySnapshot =
await getDocs(q);
 
 if
(querySnapshot.empty) {
 await
saveToFirestore('galleries', galleryData);
 } else {
 const docId =
querySnapshot.docs[0].id;
 await
updateFirestore('galleries', docId, galleryData);
 }
 }
 } catch (error) {
 console.error('Error saving
galleries:', error);
 }
 }
 
 // News functions with Firebase
 async function loadNews() {
 try {
 newsArticles = await
loadFromFirestore('news');
 displayNews();
 } catch (error) {
 console.error('Error
loading news:', error);
 }
 }
 
 // Matches functions with Firebase
 async function loadMatches() {
 try {
 matches = await
loadFromFirestore('matches');
 displayMatches();
 } catch (error) {
 console.error('Error
loading matches:', error);
 }
 }
 
 // Schedule functions with Firebase
 async function loadSchedule() {
 try {
 const { collection, getDocs
} = window.firebaseModules;
 const querySnapshot = await
getDocs(collection(window.db, 'schedule'));
 
 if (!querySnapshot.empty) {
 const scheduleData =
querySnapshot.docs[0].data();
 const rows =
document.querySelectorAll('#schedule-body tr');
 
 rows.forEach((row,
index) => {
 const day =
row.cells[0].textContent;
 if
(scheduleData[day]) {
 const inputs =
row.querySelectorAll('input');
 inputs[0].value
= scheduleData[day]['Liga del Este'] || '';
 inputs[1].value
= scheduleData[day]['Veteranos +50'] || '';
 inputs[2].value
= scheduleData[day]['Veteranos +35'] || '';
 inputs[3].value
= scheduleData[day]['Formativas'] || '';
 }
 });
 }
 } catch (error) {
 console.error('Error
loading schedule:', error);
 }
 }
 
 async function saveSchedule() {
 if (!requestAdminAccess())
return;
 
 try {
 const scheduleData = {};
 const rows =
document.querySelectorAll('#schedule-body tr');
 
 rows.forEach((row, index)
=> {
 const day =
row.cells[0].textContent;
 const inputs =
row.querySelectorAll('input');
 scheduleData[day] = {
 'Liga del Este':
inputs[0].value,
 'Veteranos +50':
inputs[1].value,
 'Veteranos +35':
inputs[2].value,
 'Formativas':
inputs[3].value
 };
 });
 
 scheduleData.timestamp =
new Date().toISOString();
 
 // Check if schedule exists
 const { collection, getDocs
} = window.firebaseModules;
 const querySnapshot = await
getDocs(collection(window.db, 'schedule'));
 
 if (querySnapshot.empty) {
 await
saveToFirestore('schedule', scheduleData);
 } else {
 const docId =
querySnapshot.docs[0].id;
 await
updateFirestore('schedule', docId, scheduleData);
 }
 
 showMessage('Horarios guardados
exitosamente!', 'success');
 } catch (error) {
 console.error('Error saving
schedule:', error);
 showMessage('Error
al guardar los horarios', 'error');
 }
 }
 
 // Hero background functions with
Firebase
 async function loadHeroBackground()
{
 try {
 const { collection, getDocs
} = window.firebaseModules;
 const querySnapshot = await
getDocs(collection(window.db, 'hero-background'));
 
 if (!querySnapshot.empty) {
 const heroData =
querySnapshot.docs[0].data();
 heroBackgroundImage =
heroData.imageUrl;

displayHeroBackground();
 }
 } catch (error) {
 console.error('Error
loading hero background:', error);
 }
 }
 
 async function saveHeroBackground()
{
 try {
 const heroData = {
 imageUrl:
heroBackgroundImage,
 timestamp: new
Date().toISOString()
 };
 
 const { collection, getDocs
} = window.firebaseModules;
 const querySnapshot = await
getDocs(collection(window.db, 'hero-background'));
 
 if (querySnapshot.empty) {
 await
saveToFirestore('hero-background', heroData);
 } else {
 const docId =
querySnapshot.docs[0].id;
 await
updateFirestore('hero-background', docId, heroData);
 }
 } catch (error) {
 console.error('Error saving
hero background:', error);
 }
 }
 
 // Modified image upload functions
 async function
handleImageUpload(event) {
 const files =
event.target.files;
 if (files.length === 0 ||
!currentCategory) return;
 
 showMessage('Subiendo
imgenes...', 'info');
 
 try {
 let uploadedCount = 0;
 const totalFiles =
Array.from(files).filter(file => file.type.startsWith('image/')).length;
 
 for (let file of files) {
 if
(file.type.startsWith('image/')) {
 // Upload to
Firebase Storage
 const imagePath =
`gallery/${currentCategory}/${Date.now()}_${file.name}`;
 const imageUrl =
await uploadImageToFirebase(file, imagePath);
 
 const imageData = {
 id: Date.now()
+ Math.random(),
 src: imageUrl,
 name:
file.name,
 path: imagePath
 };
 

imageGalleries[currentCategory].push(imageData);

displayImages(currentCategory);
 
 uploadedCount++;
 if (uploadedCount
=== totalFiles) {
 await
saveGalleries();
 const categoryNames = {
 'liga-este': 'Liga del
Este',
 'veteranos-50': 'Veteranos
+50',
 'veteranos-35': 'Veteranos
+35',
 'comienzos': 'Los
Comienzos',
 'formativas':
'Formativas',

'club-general': 'Club General'
 };

showMessage(`${totalFiles} imagen(es) subida(s) a
${categoryNames[currentCategory]}!`, 'success');
 }
 }
 }
 } catch (error) {
 console.error('Error uploading images:',
error);
 showMessage('Error al subir las imgenes',
'error');
 }
 
 // Reset the input
 event.target.value = '';
 }
 
 async function
removeImage(category, imageId) {
 try {
 const imageIndex =
imageGalleries[category].findIndex(img => img.id == imageId);
 if (imageIndex !== -1) {
 const image =
imageGalleries[category][imageIndex];
 
 // Delete from Firebase
Storage
 if (image.path) {
 await
deleteImageFromFirebase(image.path);
 }
 
 // Remove from local
array

imageGalleries[category].splice(imageIndex, 1);

displayImages(category);
 await saveGalleries();
 showMessage('Imagen
eliminada correctamente', 'success');
 }
 } catch (error) {
 console.error('Error removing image:',
error);
 showMessage('Error al eliminar la imagen',
'error');
 }
 }
 
 // Modified news functions
 async function
handleNewsImageUpload(event) {
 const file =
event.target.files[0];
 if (!file ||
!file.type.startsWith('image/')) {
 showMessage('Por
favor selecciona una imagen vlida', 'error');
 return;
 }
 
 try {
 showMessage('Subiendo
imagen...', 'info');
 const imagePath =
`news/${Date.now()}_${file.name}`;
 currentNewsImage = await
uploadImageToFirebase(file, imagePath);
 
 // Show preview

document.getElementById('news-image-upload').classList.add('hidden');

document.getElementById('news-image-preview').classList.remove('hidden');

document.getElementById('news-preview-img').src = currentNewsImage;
 
 showMessage('Imagen subida
correctamente', 'success');
 } catch (error) {
 console.error('Error
uploading news image:', error);
 showMessage('Error al subir
la imagen', 'error');
 }
 
 // Reset input
 event.target.value = '';
 }
 
 // Modified hero image functions
 async function
handleHeroImageUpload(event) {
 const file =
event.target.files[0];
 if (!file ||
!file.type.startsWith('image/')) {
 showMessage('Por
favor selecciona una imagen vlida', 'error');
 return;
 }
 
 try {
 showMessage('Subiendo
imagen de fondo...', 'info');
 const imagePath =
`hero/${Date.now()}_${file.name}`;
 heroBackgroundImage = await
uploadImageToFirebase(file, imagePath);
 
 displayHeroBackground();
 await saveHeroBackground();
 showMessage('Imagen de
fondo actualizada!', 'success');
 
 // Show remove button if in
admin mode
 if (isAuthenticated) {
 const heroRemoveButton
= document.getElementById('hero-remove-button');
 if (heroRemoveButton) {

heroRemoveButton.classList.remove('hidden');
 }
 }
 } catch (error) {
 console.error('Error uploading hero image:',
error);
 showMessage('Error al subir la imagen de
fondo', 'error');
 }
 
 // Reset input
 event.target.value = '';
 }
 
 // All other existing functions
remain the same...
 // (Authentication, UI functions,
form handlers, etc.)
 
 // Smooth scrolling for navigation
links

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

anchor.addEventListener('click', function (e) {
 e.preventDefault();
 const target =
document.querySelector(this.getAttribute('href'));
 if (target) {
 target.scrollIntoView({
 behavior: 'smooth',
 block: 'start'
 });
 }
 });
 });
 
 // Authentication functions
 function toggleAdminMode() {
 if (isAuthenticated) {
 isAuthenticated = false;
 if (authTimeout)
clearTimeout(authTimeout);
 updateAdminUI();
 showMessage('Sesin de administrador
cerrada', 'info');
 } else {
 showPasswordModal();
 }
 }
 
 function updateAdminUI() {
 const adminIcon =
document.getElementById('admin-icon');
 const adminToggle =
document.getElementById('admin-toggle');
 
 if (isAuthenticated) {
 adminIcon.textContent = '🔓';

adminToggle.classList.remove('text-gray-400');

adminToggle.classList.add('text-green-600');
 adminToggle.title =
'Modo Administrador Activo - Click para cerrar sesin';
 showProtectedUploadButtons();
 } else {
 adminIcon.textContent = '🔒';

adminToggle.classList.remove('text-green-600');

adminToggle.classList.add('text-gray-400');
 adminToggle.title =
'Activar Modo Administrador';

hideProtectedUploadButtons();
 }
 }
 
 function
showProtectedUploadButtons() {
 const protectedCategories =
['liga-este', 'veteranos-50', 'veteranos-35', 'comienzos', 'formativas'];

protectedCategories.forEach(category => {
 const uploadButton =
document.getElementById(category + '-upload');
 if (uploadButton) {

uploadButton.classList.remove('hidden');
 }
 });
 
 const scheduleSaveSection =
document.getElementById('schedule-save-section');
 if (scheduleSaveSection) {

scheduleSaveSection.classList.remove('hidden');
 }
 
 const newsFormSection =
document.getElementById('news-form-section');
 if (newsFormSection) {

newsFormSection.classList.remove('hidden');
 }
 
 const matchFormSection =
document.getElementById('match-form-section');
 if (matchFormSection) {

matchFormSection.classList.remove('hidden');
 }
 
 const heroUploadButton =
document.getElementById('hero-upload-button');
 const heroRemoveButton =
document.getElementById('hero-remove-button');
 if (heroUploadButton) {

heroUploadButton.classList.remove('hidden');
 }
 if (heroRemoveButton &&
heroBackgroundImage) {

heroRemoveButton.classList.remove('hidden');
 }
 }
 
 function
hideProtectedUploadButtons() {
 const protectedCategories =
['liga-este', 'veteranos-50', 'veteranos-35', 'comienzos', 'formativas'];

protectedCategories.forEach(category => {
 const uploadButton =
document.getElementById(category + '-upload');
 if (uploadButton) {

uploadButton.classList.add('hidden');
 }
 });
 
 const scheduleSaveSection =
document.getElementById('schedule-save-section');
 if (scheduleSaveSection) {

scheduleSaveSection.classList.add('hidden');
 }
 
 const newsFormSection =
document.getElementById('news-form-section');
 if (newsFormSection) {

newsFormSection.classList.add('hidden');
 }
 
 const matchFormSection =
document.getElementById('match-form-section');
 if (matchFormSection) {

matchFormSection.classList.add('hidden');
 }
 
 const heroUploadButton =
document.getElementById('hero-upload-button');
 const heroRemoveButton =
document.getElementById('hero-remove-button');
 if (heroUploadButton) {

heroUploadButton.classList.add('hidden');
 }
 if (heroRemoveButton) {

heroRemoveButton.classList.add('hidden');
 }
 }
 
 function requestAdminAccess(action,
category = null, imageId = null) {
 if (!isAuthenticated) {
 showMessage('Activa el modo administrador
primero (🔒
en el men)', 'info');
 return false;
 }
 return true;
 }
 
 function showPasswordModal() {
 const overlay =
document.createElement('div');
 overlay.className = 'fixed
inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
 overlay.id = 'password-modal';
 
 const modal =
document.createElement('div');
 modal.className = 'bg-white
rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl';
 
 modal.innerHTML = `
 <div
class="text-center mb-6">
 <div
class="text-4xl mb-3">🔐</div>
 <h3
class="text-xl font-bold text-blue-900 mb-2">Acceso de
Administrador</h3>
 <p
class="text-gray-600">Ingresa la contrasea para
continuar</p>
 </div>
 
 <div
class="mb-6">
 <label
for="admin-password" class="block text-sm font-medium
text-gray-700 mb-2">Contrasea:</label>
 <input
type="password" id="admin-password" 

class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2
focus:ring-blue-500 focus:border-transparent"

placeholder="Ingresa la contrasea">
 <div
id="password-error" class="text-red-500 text-sm mt-2
hidden">Contrasea incorrecta</div>
 </div>
 
 <div class="flex
gap-3">
 <button
onclick="closePasswordModal()" 

class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3
rounded-lg font-medium transition-colors">
 Cancelar
 </button>
 <button
onclick="verifyPassword()" 

class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3
rounded-lg font-medium transition-colors">
 Acceder
 </button>
 </div>
 `;
 
 overlay.appendChild(modal);

document.body.appendChild(overlay);
 
 setTimeout(() => {

document.getElementById('admin-password').focus();
 }, 100);
 

document.getElementById('admin-password').addEventListener('keypress',
function(e) {
 if (e.key === 'Enter') {
 verifyPassword();
 }
 });
 }
 
 function verifyPassword() {
 const password =
document.getElementById('admin-password').value;
 const errorDiv =
document.getElementById('password-error');
 
 if (password ===
ADMIN_PASSWORD) {
 isAuthenticated = true;
 closePasswordModal();
 updateAdminUI();
 
 if (authTimeout)
clearTimeout(authTimeout);
 authTimeout = setTimeout(()
=> {
 isAuthenticated =
false;
 updateAdminUI();
 showMessage('Sesin
de administrador expirada', 'info');
 }, 30 * 60 * 1000);
 
 showMessage('Modo administrador activado!
Sesin vlida por 30 minutos', 'success');
 } else {

errorDiv.classList.remove('hidden');

document.getElementById('admin-password').value = '';

document.getElementById('admin-password').focus();
 }
 }
 
 function closePasswordModal() {
 const modal =
document.getElementById('password-modal');
 if (modal) {
 modal.remove();
 }
 }
 
 // Image upload functionality
 function uploadImage(category) {
 if (!requestAdminAccess())
return;
 currentCategory = category;

document.getElementById('imageInput').click();
 }
 
 function
uploadImagePublic(category) {
 currentCategory = category;

document.getElementById('imageInput').click();
 }
 
 function displayImages(category) {
 const gallery =
document.getElementById(category + '-gallery');
 const images =
imageGalleries[category];
 
 gallery.innerHTML = '';
 
 images.forEach(image => {
 const imageContainer =
document.createElement('div');
 imageContainer.className =
'relative group';
 
 const heightClass =
category === 'club-general' ? 'h-24' : 'h-20';
 
 imageContainer.innerHTML =
`
 <img
src="${image.src}" alt="${image.name}" class="w-full
${heightClass} object-cover rounded border shadow-sm hover:shadow-md
transition-shadow">
 <button
onclick="${category === 'club-general' ? `removeImagePublic('${category}',
'${image.id}')` : `removeImageWithAuth('${category}', '${image.id}')`}" 

class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white
rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100
transition-opacity flex items-center justify-center font-bold">
 
 </button>
 `;
 

gallery.appendChild(imageContainer);
 });
 
 updateImageCount(category);
 }
 
 function updateImageCount(category)
{
 const count =
imageGalleries[category].length;
 const countElement =
document.getElementById(`count-${category}`);
 if (countElement) {
 countElement.textContent =
count;
 }
 }
 
 function updateAllCounts() {

Object.keys(imageGalleries).forEach(category => {
 updateImageCount(category);
 });
 }
 
 function
removeImageWithAuth(category, imageId) {
 if (!requestAdminAccess())
return;
 removeImage(category, imageId);
 }
 
 function
removeImagePublic(category, imageId) {
 removeImage(category, imageId);
 }
 
 function showMessage(message, type)
{
 const messageDiv =
document.createElement('div');
 let bgColor = 'bg-red-500';
 if (type === 'success') bgColor
= 'bg-green-500';
 if (type === 'info') bgColor =
'bg-blue-500';
 
 messageDiv.className = `fixed
top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium ${bgColor}`;
 messageDiv.textContent =
message;
 

document.body.appendChild(messageDiv);
 
 setTimeout(() => {
 messageDiv.remove();
 }, 4000);
 }
 
 // News functions
 function uploadNewsImage() {

document.getElementById('newsImageInput').click();
 }
 
 function removeNewsImage() {
 currentNewsImage = null;

document.getElementById('news-image-upload').classList.remove('hidden');

document.getElementById('news-image-preview').classList.add('hidden');
 }
 
 function clearNewsForm() {

document.getElementById('news-form').reset();
 removeNewsImage();

document.getElementById('news-date').value = new
Date().toISOString().split('T')[0];
 }
 
 function displayNews() {
 const container =
document.getElementById('news-container');
 const noNewsMessage =
document.getElementById('no-news-message');
 
 if (newsArticles.length === 0)
{
 container.innerHTML = '';

noNewsMessage.classList.remove('hidden');
 return;
 }
 

noNewsMessage.classList.add('hidden');
 
 container.innerHTML =
newsArticles.map(article => {
 const categoryIcons
= {
 'general': '🏀',
 'liga-este': '🏆',
 'veteranos-50': '🥇',
 'veteranos-35': '🏅',
 'formativas': '🌟',
 'eventos': '🎉'
 };
 
 const categoryNames = {
 'general':
'General',
 'liga-este': 'Liga del Este',
 'veteranos-50': 'Veteranos +50',
 'veteranos-35': 'Veteranos +35',
 'formativas':
'Formativas',
 'eventos': 'Eventos'
 };
 
 const formattedDate = new
Date(article.date).toLocaleDateString('es-ES', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 });
 
 return `
 <article
class="bg-white rounded-xl shadow-lg overflow-hidden border-2
border-gray-200 hover:border-blue-300 transition-colors">
 <div
class="md:flex">
 ${article.image
? `
 <div
class="md:w-1/3">
 <img
src="${article.image}" alt="${article.title}"
class="w-full h-64 md:h-full object-cover">

</div>
 ` : ''}
 <div
class="${article.image ? 'md:w-2/3' : 'w-full'} p-6">
 <div
class="flex items-center justify-between mb-4">

<span class="inline-flex items-center px-3 py-1 rounded-full text-sm
font-medium bg-blue-100 text-blue-800">

${categoryIcons[article.category]} ${categoryNames[article.category]}

</span>

<time class="text-sm
text-gray-500">${formattedDate}</time>

</div>
 
 <h3
class="text-xl font-bold text-gray-900
mb-3">${article.title}</h3>
 
 <div
class="text-gray-700 leading-relaxed mb-4">

${article.content.split('\n').map(paragraph => 

paragraph.trim() ? `<p class="mb-2">${paragraph}</p>` :
''

).join('')}

</div>
 

${isAuthenticated ? `
 <div
class="flex justify-end">

<button onclick="deleteNews('${article.id}')" 

class="text-red-600 hover:text-red-800 text-sm font-medium">

🗑️ Eliminar

</button>

</div>
 ` : ''}
 </div>
 </div>
 </article>
 `;
 }).join('');
 }
 
 async function
deleteNews(articleId) {
 if (!requestAdminAccess())
return;
 
 try {
 await
deleteFromFirestore('news', articleId);
 showMessage('Noticia
eliminada correctamente', 'success');
 } catch (error) {
 console.error('Error deleting news:',
error);
 showMessage('Error al eliminar la noticia',
'error');
 }
 }
 
 // Hero background functions
 function uploadHeroImage() {
 if (!requestAdminAccess())
return;

document.getElementById('heroImageInput').click();
 }
 
 function displayHeroBackground() {
 const heroBackground =
document.getElementById('hero-background');
 const heroOverlay =
document.getElementById('hero-overlay');
 
 if (heroBackgroundImage
&& heroBackground && heroOverlay) {

heroBackground.style.backgroundImage = `url(${heroBackgroundImage})`;

heroBackground.style.opacity = '1';
 heroOverlay.style.opacity =
'0.4';
 }
 }
 
 async function removeHeroImage() {
 if (!requestAdminAccess())
return;
 
 try {
 heroBackgroundImage = null;
 const heroBackground =
document.getElementById('hero-background');
 const heroOverlay =
document.getElementById('hero-overlay');
 const heroRemoveButton =
document.getElementById('hero-remove-button');
 
 if (heroBackground) {

heroBackground.style.backgroundImage = '';

heroBackground.style.opacity = '0';
 }
 if (heroOverlay) {

heroOverlay.style.opacity = '0';
 }
 if (heroRemoveButton) {

heroRemoveButton.classList.add('hidden');
 }
 
 // Remove from Firebase
 const { collection, getDocs
} = window.firebaseModules;
 const querySnapshot = await
getDocs(collection(window.db, 'hero-background'));
 if (!querySnapshot.empty) {
 await
deleteFromFirestore('hero-background', querySnapshot.docs[0].id);
 }
 
 showMessage('Imagen de fondo eliminada',
'success');
 } catch (error) {
 console.error('Error removing hero image:',
error);
 showMessage('Error al eliminar la imagen de
fondo', 'error');
 }
 }
 
 // Match functions
 function uploadSanPabloShield() {

document.getElementById('sanPabloShieldInput').click();
 }
 
 function uploadRivalShield() {

document.getElementById('rivalShieldInput').click();
 }
 
 async function
handleSanPabloShieldUpload(event) {
 const file =
event.target.files[0];
 if (!file ||
!file.type.startsWith('image/')) {
 showMessage('Por
favor selecciona una imagen vlida', 'error');
 return;
 }
 
 try {
 showMessage('Subiendo
escudo...', 'info');
 const imagePath =
`shields/san-pablo/${Date.now()}_${file.name}`;
 currentSanPabloShield =
await uploadImageToFirebase(file, imagePath);
 

document.getElementById('san-pablo-shield-upload').classList.add('hidden');

document.getElementById('san-pablo-shield-preview').classList.remove('hidden');

document.getElementById('san-pablo-preview-img').src = currentSanPabloShield;
 
 showMessage('Escudo subido
correctamente', 'success');
 } catch (error) {
 console.error('Error
uploading shield:', error);
 showMessage('Error al subir el escudo',
'error');
 }
 
 event.target.value = '';
 }
 
 async function
handleRivalShieldUpload(event) {
 const file =
event.target.files[0];
 if (!file ||
!file.type.startsWith('image/')) {
 showMessage('Por
favor selecciona una imagen vlida', 'error');
 return;
 }
 
 try {
 showMessage('Subiendo
escudo...', 'info');
 const imagePath =
`shields/rival/${Date.now()}_${file.name}`;
 currentRivalShield = await
uploadImageToFirebase(file, imagePath);
 

document.getElementById('rival-shield-upload').classList.add('hidden');

document.getElementById('rival-shield-preview').classList.remove('hidden');

document.getElementById('rival-preview-img').src = currentRivalShield;
 
 showMessage('Escudo
subido correctamente', 'success');
 } catch (error) {
 console.error('Error uploading shield:',
error);
 showMessage('Error al subir el escudo',
'error');
 }
 
 event.target.value = '';
 }
 
 function removeSanPabloShield() {
 currentSanPabloShield = null;

document.getElementById('san-pablo-shield-upload').classList.remove('hidden');

document.getElementById('san-pablo-shield-preview').classList.add('hidden');
 }
 
 function removeRivalShield() {
 currentRivalShield = null;

document.getElementById('rival-shield-upload').classList.remove('hidden');

document.getElementById('rival-shield-preview').classList.add('hidden');
 }
 
 function clearMatchForm() {

document.getElementById('match-form').reset();
 removeSanPabloShield();
 removeRivalShield();
 }
 
 function displayMatches() {
 const container =
document.getElementById('matches-container');
 const noMatchesMessage =
document.getElementById('no-matches-message');
 
 if (matches.length === 0) {
 container.innerHTML = '';

noMatchesMessage.classList.remove('hidden');
 return;
 }
 

noMatchesMessage.classList.add('hidden');
 
 const scheduledMatches =
matches.filter(match => match.status === 'scheduled');
 const finishedMatches =
matches.filter(match => match.status === 'finished');
 
 let html = '';
 
 if (scheduledMatches.length
> 0) {
 html += `
 <div
class="mb-8">
 <h4
class="text-2xl font-bold text-blue-900 mb-6 text-center">🔥 Prximos Partidos</h4>
 <div
class="space-y-4">

${scheduledMatches.map(match => renderMatch(match)).join('')}
 </div>
 </div>
 `;
 }
 
 if (finishedMatches.length >
0) {
 html += `
 <div>
 <h4
class="text-2xl font-bold text-blue-900 mb-6 text-center">📊 Resultados</h4>
 <div
class="space-y-4">

${finishedMatches.map(match => renderMatch(match)).join('')}
 </div>
 </div>
 `;
 }
 
 container.innerHTML = html;
 }
 
 function renderMatch(match) {
 const categoryIcons = {
 'liga-este': '🏆',
 'veteranos-50': '🥇',
 'veteranos-35': '🏅',
 'amistoso': '🤝'
 };
 
 const categoryNames = {
 'liga-este': 'Liga del Este',
 'veteranos-50': 'Veteranos +50',
 'veteranos-35': 'Veteranos +35',
 'amistoso': 'Partido
Amistoso'
 };
 
 const matchDate = new
Date(match.date);
 const formattedDate =
matchDate.toLocaleDateString('es-ES', {
 weekday: 'long',
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 });
 const formattedTime =
matchDate.toLocaleTimeString('es-ES', {
 hour: '2-digit',
 minute: '2-digit'
 });
 
 const isFinished = match.status
=== 'finished';
 const isPast = new Date() >
matchDate;
 
 return `
 <div
class="bg-white rounded-xl shadow-lg overflow-hidden border-2 ${isFinished
? 'border-green-300' : 'border-blue-300'} hover:shadow-xl
transition-shadow">
 <div
class="p-6">
 <div
class="flex items-center justify-between mb-6">
 <span
class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
${isFinished ? 'bg-green-100 text-green-800' : 'bg-blue-100
text-blue-800'}">

${categoryIcons[match.category]} ${categoryNames[match.category]}
 </span>
 <div
class="text-right">
 <div
class="text-sm font-medium
text-gray-900">${formattedDate}</div>
 <div
class="text-sm text-gray-600">${formattedTime}</div>
 </div>
 </div>
 
 <div
class="flex items-center justify-between mb-6">
 <div
class="flex-1 text-center">
 <div
class="mb-3">

${match.sanPabloShield ? 

`<img src="${match.sanPabloShield}" alt="San Pablo"
class="w-16 h-16 mx-auto object-contain">` :

`<div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex
items-center justify-center text-2xl">🏀</div>`
 }

</div>
 <h5
class="font-bold text-blue-900">San Pablo</h5>
 </div>
 
 <div
class="flex-shrink-0 mx-6">

${isFinished && match.result ? 

`<div class="text-center">

<div class="text-3xl font-bold
text-gray-900">${match.result.sanPablo} -
${match.result.rival}</div>

<div class="text-sm text-gray-600">Resultado Final</div>

</div>` :

`<div class="text-center">

<div class="text-2xl font-bold text-gray-400">VS</div>

${isPast && !isFinished ? '<div class="text-xs text-orange-600
font-medium">Pendiente resultado</div>' : ''}

</div>`
 }
 </div>
 
 <div
class="flex-1 text-center">
 <div
class="mb-3">

${match.rivalShield ? 

`<img src="${match.rivalShield}" alt="${match.rival}"
class="w-16 h-16 mx-auto object-contain">` :

`<div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex
items-center justify-center text-2xl">🛡️</div>`
 }

</div>
 <h5
class="font-bold text-gray-900">${match.rival}</h5>
 </div>
 </div>
 
 <div
class="bg-gray-50 rounded-lg p-4 mb-4">
 <div
class="flex items-center justify-center">
 <span
class="text-gray-600">📍 ${match.location}</span>
 </div>
 </div>
 
 ${isAuthenticated ?
`
 <div
class="flex justify-center gap-3">

${!isFinished && isPast ? `

<button onclick="addResult('${match.id}')" 

class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg
text-sm font-medium transition-colors">
 📊 Agregar
Resultado
 </button>
 ` : ''}
 ${isFinished
? `

<button onclick="editResult('${match.id}')" 

class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg
text-sm font-medium transition-colors">
 ✏️ Editar Resultado

</button>
 ` : ''}
 <button
onclick="deleteMatch('${match.id}')" 

class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm
font-medium transition-colors">
 🗑️ Eliminar

</button>
 </div>
 ` : ''}
 </div>
 </div>
 `;
 }
 
 function addResult(matchId) {
 if (!requestAdminAccess())
return;
 showResultModal(matchId,
false);
 }
 
 function editResult(matchId) {
 if (!requestAdminAccess())
return;
 showResultModal(matchId, true);
 }
 
 function showResultModal(matchId,
isEdit) {
 const match = matches.find(m
=> m.id === matchId);
 if (!match) return;
 
 const overlay =
document.createElement('div');
 overlay.className = 'fixed
inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
 overlay.id = 'result-modal';
 
 const modal =
document.createElement('div');
 modal.className = 'bg-white
rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl';
 
 const currentResult =
match.result || { sanPablo: 0, rival: 0 };
 
 modal.innerHTML = `
 <div
class="text-center mb-6">
 <div
class="text-4xl mb-3">📊</div>
 <h3
class="text-xl font-bold text-blue-900 mb-2">${isEdit ? 'Editar' :
'Agregar'} Resultado</h3>
 <p
class="text-gray-600">San Pablo vs ${match.rival}</p>
 </div>
 
 <div
class="space-y-4 mb-6">
 <div
class="flex items-center gap-4">
 <label
class="flex-1 text-sm font-medium text-gray-700">San
Pablo:</label>
 <input
type="number" id="san-pablo-score" min="0"
value="${currentResult.sanPablo}"

class="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-2
focus:ring-blue-500 focus:border-transparent">
 </div>
 <div
class="flex items-center gap-4">
 <label
class="flex-1 text-sm font-medium
text-gray-700">${match.rival}:</label>
 <input
type="number" id="rival-score" min="0"
value="${currentResult.rival}"

class="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-2
focus:ring-blue-500 focus:border-transparent">
 </div>
 </div>
 
 <div class="flex
gap-3">
 <button
onclick="closeResultModal()" 

class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3
rounded-lg font-medium transition-colors">
 Cancelar
 </button>
 <button
onclick="saveResult('${matchId}')" 

class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3
rounded-lg font-medium transition-colors">
 Guardar
 </button>
 </div>
 `;
 
 overlay.appendChild(modal);

document.body.appendChild(overlay);
 
 setTimeout(() => {

document.getElementById('san-pablo-score').focus();
 }, 100);
 }
 
 async function saveResult(matchId)
{
 const sanPabloScore =
parseInt(document.getElementById('san-pablo-score').value) || 0;
 const rivalScore =
parseInt(document.getElementById('rival-score').value) || 0;
 
 try {
 const updateData = {
 result: {
 sanPablo:
sanPabloScore,
 rival: rivalScore
 },
 status: 'finished'
 };
 
 await
updateFirestore('matches', matchId, updateData);
 closeResultModal();
 showMessage('Resultado guardado
exitosamente!', 'success');
 } catch (error) {
 console.error('Error saving result:',
error);
 showMessage('Error al guardar el resultado',
'error');
 }
 }
 
 function closeResultModal() {
 const modal =
document.getElementById('result-modal');
 if (modal) {
 modal.remove();
 }
 }
 
 async function deleteMatch(matchId)
{
 if (!requestAdminAccess())
return;
 
 const match = matches.find(m
=> m.id === matchId);
 if (!match) return;
 
 const overlay =
document.createElement('div');
 overlay.className = 'fixed
inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
 overlay.id = 'delete-modal';
 
 const modal =
document.createElement('div');
 modal.className = 'bg-white
rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl';
 
 modal.innerHTML = `
 <div
class="text-center mb-6">
 <div
class="text-4xl mb-3">⚠️</div>
 <h3
class="text-xl font-bold text-red-900 mb-2">Confirmar
Eliminacin</h3>
 <p
class="text-gray-600">Ests seguro de eliminar este
partido?</p>
 <p
class="text-sm text-gray-500 mt-2">San Pablo vs
${match.rival}</p>
 </div>
 
 <div class="flex
gap-3">
 <button
onclick="closeDeleteModal()" 

class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3
rounded-lg font-medium transition-colors">
 Cancelar
 </button>
 <button
onclick="confirmDeleteMatch('${matchId}')" 

class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg
font-medium transition-colors">
 Eliminar
 </button>
 </div>
 `;
 
 overlay.appendChild(modal);

document.body.appendChild(overlay);
 }
 
 async function
confirmDeleteMatch(matchId) {
 try {
 await
deleteFromFirestore('matches', matchId);
 closeDeleteModal();
 showMessage('Partido
eliminado correctamente', 'success');
 } catch (error) {
 console.error('Error
deleting match:', error);
 showMessage('Error al
eliminar el partido', 'error');
 }
 }
 
 function closeDeleteModal() {
 const modal =
document.getElementById('delete-modal');
 if (modal) {
 modal.remove();
 }
 }
 
 // Form event listeners

document.addEventListener('DOMContentLoaded', function() {
 const newsForm =
document.getElementById('news-form');
 if (newsForm) {

newsForm.addEventListener('submit', async function(e) {
 e.preventDefault();
 
 const title =
document.getElementById('news-title').value.trim();
 const date =
document.getElementById('news-date').value;
 const category =
document.getElementById('news-category').value;
 const content =
document.getElementById('news-content').value.trim();
 
 if (!title || !date ||
!category || !content) {
 showMessage('Por
favor completa todos los campos obligatorios', 'error');
 return;
 }
 
 try {
 const newsArticle =
{
 title: title,
 date: date,
 category:
category,
 content:
content,
 image:
currentNewsImage,
 timestamp: new
Date().toISOString()
 };
 
 await
saveToFirestore('news', newsArticle);
 clearNewsForm();
 showMessage('Noticia
publicada exitosamente!', 'success');
 } catch (error) {
 console.error('Error saving news:',
error);
 showMessage('Error al publicar la
noticia', 'error');
 }
 });
 }
 
 const newsDateInput =
document.getElementById('news-date');
 if (newsDateInput) {
 newsDateInput.value = new
Date().toISOString().split('T')[0];
 }
 
 const matchForm =
document.getElementById('match-form');
 if (matchForm) {

matchForm.addEventListener('submit', async function(e) {
 e.preventDefault();
 
 const date =
document.getElementById('match-date').value;
 const location =
document.getElementById('match-location').value.trim();
 const category =
document.getElementById('match-category').value;
 const rival =
document.getElementById('match-rival').value.trim();
 
 if (!date || !location
|| !category || !rival) {
 showMessage('Por
favor completa todos los campos obligatorios', 'error');
 return;
 }
 
 try {
 const match = {
 date: date,
 location:
location,
 category:
category,
 rival: rival,
 sanPabloShield:
currentSanPabloShield,
 rivalShield:
currentRivalShield,
 status:
'scheduled',
 result: null,
 timestamp: new
Date().toISOString()
 };
 
 await
saveToFirestore('matches', match);
 clearMatchForm();
 showMessage('Partido
programado exitosamente!', 'success');
 } catch (error) {
 console.error('Error saving match:',
error);
 showMessage('Error al programar el
partido', 'error');
 }
 });
 }
 });
 

(function(){function c(){var
b=a.contentDocument||a.contentWindow.document;if(b){var
d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'992e2186863df1ca',t:'MTc2MTE4OTk2Ni4wMDAwMDA='};var
a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var
a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else
if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var
e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();