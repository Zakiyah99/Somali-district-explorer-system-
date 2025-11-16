
let currentSection = 'regions';
let currentEditRegion = '';
let currentEditDistrict = '';

document.addEventListener('DOMContentLoaded', function() {
  if (!requireAuth()) {
    return;
  }

  const user = getLoggedInUser();
  if (user) {
    document.getElementById('userInfoSidebar').textContent = user.name;
  }

  initializeStorage();
  setupNavigation();
  setupModals();
  setupBurgerMenu();
  setupEventListeners();
  loadRegionsTable();
  loadDistrictsTable();
  loadUsersTable();
});


function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(`${section}Section`).classList.add('active');
      
      currentSection = section;
      updatePageTitle(section);
      
      if (section === 'regions') {
        loadRegionsTable();
      } else if (section === 'districts') {
        loadDistrictsTable();
      } else if (section === 'users') {
        loadUsersTable();
      }
    });
  });
}


function updatePageTitle(section) {
  const titles = {
    'regions': 'Regions Management',
    'districts': 'Districts Management',
    'users': 'Users Management'
  };
  document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
}

// Sidebar / burger menu behavior for small screens
function setupBurgerMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');

  if (!menuToggle || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    showOverlay();
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    hideOverlay();
  }

  menuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // close when a nav link is clicked (on small screens)
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  // overlay management
  function showOverlay() {
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeSidebar);
    }
    setTimeout(() => overlay.classList.add('show'), 10);
  }

  function hideOverlay() {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }
  }

  // close on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
}


function setupModals() {
  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const modalId = this.getAttribute('data-modal');
      if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.style.display = 'none';
          modal.style.visibility = 'hidden';
          modal.style.opacity = '0';
          modal.classList.remove('active');
        }
      }
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        this.style.visibility = 'hidden';
        this.style.opacity = '0';
        this.classList.remove('active');
      }
    });
  });
}


function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', function() {
    logout();
    window.location.href = '../login/login.html';
  });

  document.getElementById('addNewBtn').addEventListener('click', function() {
    if (currentSection === 'regions') {
      showAddRegionModal();
    } else if (currentSection === 'districts') {
      showAddDistrictModal();
    } else if (currentSection === 'users') {
      showAddUserModal();
    }
  });

  const addDetailsBtn = document.getElementById('addDetailsBtn');
  if (addDetailsBtn) {
    addDetailsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add Details button clicked');
      showAddDetailsModal();
    });
  } else {
    console.error('Add Details button not found!');
  }

  document.getElementById('confirmAddRegion').addEventListener('click', function() {
    const name = document.getElementById('newRegionName').value.trim();
    if (name) {
      addRegion(name);
      document.getElementById('addRegionModal').style.display = 'none';
      document.getElementById('newRegionName').value = '';
      loadRegionsTable();
      showNotification('Region added successfully!');
    }
  });

  document.getElementById('confirmAddDistrict').addEventListener('click', function() {
    const region = document.getElementById('newDistrictRegion').value;
    const name = document.getElementById('newDistrictName').value.trim();
    if (region && name) {
      addDistrict(region, name);
      document.getElementById('addDistrictModal').style.display = 'none';
      document.getElementById('newDistrictName').value = '';
      loadDistrictsTable();
      showNotification('District added successfully!');
    }
  });

  document.getElementById('confirmAddUser').addEventListener('click', function() {
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    if (name && email && password) {
      addUser(name, email, password);
      document.getElementById('addUserModal').style.display = 'none';
      document.getElementById('newUserName').value = '';
      document.getElementById('newUserEmail').value = '';
      document.getElementById('newUserPassword').value = '';
      loadUsersTable();
      showNotification('User added successfully!');
    }
  });

  setupEditDistrictTabs();

  document.getElementById('saveDetailsBtn').addEventListener('click', function() {
    if (currentEditRegion && currentEditDistrict) {
      const details = document.getElementById('editDistrictDetails').value;
      updateDistrictDetails(currentEditRegion, currentEditDistrict, details);
      showNotification('Details saved successfully!');
      loadDistrictsTable();
    }
  });

  document.getElementById('saveMapScriptBtn').addEventListener('click', function() {
    if (currentEditRegion && currentEditDistrict) {
      const mapIframe = document.getElementById('editMapScript').value;
      updateDistrictMapScript(currentEditRegion, currentEditDistrict, mapIframe);
      showNotification('Map saved successfully!');
      updateEditMapPreview();
      loadDistrictsTable();
    }
  });

  document.getElementById('editMapScript').addEventListener('input', function() {
    clearTimeout(window.editMapPreviewTimeout);
    window.editMapPreviewTimeout = setTimeout(() => {
      updateEditMapPreview();
    }, 500);
  });

  document.getElementById('uploadImageBtn').addEventListener('click', function() {
    document.getElementById('editImageUpload').click();
  });

  document.getElementById('editImageUpload').addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0 && currentEditRegion && currentEditDistrict) {
      await uploadImages(files);
      e.target.value = '';
    }
  });

  setupMultiStepForm();

  document.getElementById('detailDescription').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('detailCharCount').textContent = count.toLocaleString();
  });

  document.getElementById('editDistrictDetails').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('editCharCount').textContent = count.toLocaleString();
  });
}

let currentStep = 1;
let detailImages = [];
let detailRegion = '';
let detailDistrict = '';


function setupMultiStepForm() {
  document.getElementById('detailsRegionSelect').addEventListener('change', function() {
    const region = this.value;
    const districtSelect = document.getElementById('detailsDistrictSelect');
    
    if (region) {
      loadDistrictsForDetails(region);
      districtSelect.disabled = false;
    } else {
      districtSelect.innerHTML = '<option value="">-- Select District --</option>';
      districtSelect.disabled = true;
    }
  });

  const nextStepBtn = document.getElementById('nextStepBtn');
  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Next button clicked, currentStep:', currentStep);
      if (validateCurrentStep()) {
        nextStep();
      } else {
        console.log('Validation failed');
      }
    });
  } else {
    console.error('nextStepBtn not found!');
  }

  const prevStepBtn = document.getElementById('prevStepBtn');
  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Previous button clicked, currentStep:', currentStep);
      previousStep();
    });
  } else {
    console.error('prevStepBtn not found!');
  }

  document.getElementById('saveAllDetailsBtn').addEventListener('click', function() {
    saveAllDetails();
  });

  document.getElementById('detailUploadBtn').addEventListener('click', function() {
    document.getElementById('detailImageUpload').click();
  });

  document.getElementById('detailImageUpload').addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await uploadDetailImages(files);
      e.target.value = '';
    }
  });

  document.getElementById('detailMapIframe').addEventListener('input', function() {
    clearTimeout(window.mapPreviewTimeout);
    window.mapPreviewTimeout = setTimeout(() => {
      updateDetailMapPreview();
    }, 500);
  });
}

function updateDetailMapPreview() {
  const mapContainer = document.getElementById('detailMapPreview');
  const mapIframe = document.getElementById('detailMapIframe').value.trim();
  
  if (!mapIframe) {
    mapContainer.innerHTML = '<div class="map-placeholder">No map configured</div>';
    return;
  }
  
  let iframeHtml = mapIframe;
  
  if (mapIframe.startsWith('http')) {
    iframeHtml = `<iframe src="${mapIframe}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  } else if (mapIframe.includes('<iframe')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mapIframe;
    const iframe = tempDiv.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframeHtml = iframe.outerHTML;
    }
  }
  
  mapContainer.innerHTML = iframeHtml;
}

function validateCurrentStep() {
  if (currentStep === 1) {
    const region = document.getElementById('detailsRegionSelect').value;
    const district = document.getElementById('detailsDistrictSelect').value;
    
    if (!region || !district) {
      showNotification('Please select both region and district', 'error');
      return false;
    }
    
    detailRegion = region;
    detailDistrict = district;
    return true;
  }
  
  if (currentStep === 2) {
    return true;
  }
  
  if (currentStep === 3) {
    return true;
  }
  
  return true;
}

function nextStep() {
  console.log('nextStep called, currentStep:', currentStep);
  
  if (currentStep < 4) {
    const currentStepEl = document.getElementById(`step${currentStep}`);
    const currentStepItem = document.querySelector(`#addDetailsModal .step-item[data-step="${currentStep}"]`);
    
    if (currentStepEl) currentStepEl.classList.remove('active');
    if (currentStepItem) currentStepItem.classList.remove('active');
    
    currentStep++;
    console.log('Moving to step:', currentStep);
    
    const nextStepEl = document.getElementById(`step${currentStep}`);
    const nextStepItem = document.querySelector(`#addDetailsModal .step-item[data-step="${currentStep}"]`);
    
    if (nextStepEl) {
      nextStepEl.classList.add('active');
      console.log('Step', currentStep, 'shown');
    } else {
      console.error('Step element not found:', `step${currentStep}`);
    }
    
    if (nextStepItem) {
      nextStepItem.classList.add('active');
    }
    
    updateStepButtons();
    
    if (currentStep === 3) {
      setTimeout(() => {
        const mapIframe = document.getElementById('detailMapIframe');
        if (mapIframe && mapIframe.value.trim()) {
          updateDetailMapPreview();
        }
      }, 100);
    }
    
    if (currentStep === 4) {
      if (detailRegion && detailDistrict) {
        loadDetailImages();
      } else {
        loadDetailImages();
      }
    }
  } else {
    console.log('Already on last step');
  }
}

function previousStep() {
  console.log('previousStep called, currentStep:', currentStep);
  
  if (currentStep > 1) {
    const currentStepEl = document.getElementById(`step${currentStep}`);
    const currentStepItem = document.querySelector(`#addDetailsModal .step-item[data-step="${currentStep}"]`);
    
    if (currentStepEl) currentStepEl.classList.remove('active');
    if (currentStepItem) currentStepItem.classList.remove('active');
    
    currentStep--;
    console.log('Moving to step:', currentStep);
    
    const prevStepEl = document.getElementById(`step${currentStep}`);
    const prevStepItem = document.querySelector(`#addDetailsModal .step-item[data-step="${currentStep}"]`);
    
    if (prevStepEl) {
      prevStepEl.classList.add('active');
      console.log('Step', currentStep, 'shown');
    } else {
      console.error('Step element not found:', `step${currentStep}`);
    }
    
    if (prevStepItem) {
      prevStepItem.classList.add('active');
    }
    
    updateStepButtons();
    
    if (currentStep === 3) {
      setTimeout(() => {
        const mapIframe = document.getElementById('detailMapIframe');
        if (mapIframe && mapIframe.value.trim()) {
          updateDetailMapPreview();
        }
      }, 100);
    }
  } else {
    console.log('Already on first step');
  }
}

function updateStepButtons() {
  console.log('updateStepButtons called, currentStep:', currentStep);
  
  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  const saveBtn = document.getElementById('saveAllDetailsBtn');
  
  if (!prevBtn || !nextBtn || !saveBtn) {
    console.error('Step buttons not found!', { prevBtn, nextBtn, saveBtn });
    return;
  }
  
  if (currentStep === 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
    console.log('Step 1: Showing Next button only');
  } else if (currentStep === 4) {
    prevBtn.style.display = 'inline-flex';
    nextBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    console.log('Step 4: Showing Previous and Save buttons');
  } else {
    prevBtn.style.display = 'inline-flex';
    nextBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
    console.log('Step', currentStep, ': Showing Previous and Next buttons');
  }
}

function saveAllDetails() {
  if (!detailRegion || !detailDistrict) {
    showNotification('Please complete all steps', 'error');
    return;
  }
  
  const governorName = document.getElementById('detailGovernorName').value.trim();
  const famousCulture = document.getElementById('detailFamousCulture').value.trim();
  const population = document.getElementById('detailPopulation').value.trim();
  const area = document.getElementById('detailArea').value.trim();
  const description = document.getElementById('detailDescription').value.trim();
  const mapIframe = document.getElementById('detailMapIframe').value.trim();
  
  let detailsText = '';
  if (governorName) detailsText += `Governor: ${governorName}\n\n`;
  if (famousCulture) detailsText += `Famous Culture: ${famousCulture}\n\n`;
  if (population) detailsText += `Population: ${population}\n\n`;
  if (area) detailsText += `Area: ${area} km²\n\n`;
  if (description) detailsText += `Description:\n${description}`;
  
  updateDistrictDetails(detailRegion, detailDistrict, detailsText);
  
  if (mapIframe) {
    updateDistrictMapScript(detailRegion, detailDistrict, mapIframe);
  }
  
  if (detailImages.length > 0) {
    const districtData = getDistrict(detailRegion, detailDistrict) || { details: '', mapScript: '', images: [] };
    districtData.images = detailImages;
    setDistrict(detailRegion, detailDistrict, districtData);
  }
  
  document.getElementById('addDetailsModal').style.display = 'none';
  resetMultiStepForm();
  loadDistrictsTable();
  showNotification('District information saved successfully!');
}

function resetMultiStepForm() {
  currentStep = 1;
  detailImages = [];
  detailRegion = '';
  detailDistrict = '';
  
  try {
    const formSteps = document.querySelectorAll('#addDetailsModal .form-step');
    const stepItems = document.querySelectorAll('#addDetailsModal .step-item');
    
    formSteps.forEach(step => step.classList.remove('active'));
    stepItems.forEach(item => item.classList.remove('active'));
    
    const step1 = document.getElementById('step1');
    const stepItem1 = document.querySelector('#addDetailsModal .step-item[data-step="1"]');
    
    if (step1) step1.classList.add('active');
    if (stepItem1) stepItem1.classList.add('active');
    
    const regionSelect = document.getElementById('detailsRegionSelect');
    const districtSelect = document.getElementById('detailsDistrictSelect');
    const governorName = document.getElementById('detailGovernorName');
    const famousCulture = document.getElementById('detailFamousCulture');
    const population = document.getElementById('detailPopulation');
    const area = document.getElementById('detailArea');
    const description = document.getElementById('detailDescription');
    const mapIframe = document.getElementById('detailMapIframe');
    const charCount = document.getElementById('detailCharCount');
    const imagesGallery = document.getElementById('detailImagesGallery');
    const mapPreview = document.getElementById('detailMapPreview');
    
    if (regionSelect) regionSelect.value = '';
    if (districtSelect) {
      districtSelect.innerHTML = '<option value="">-- Select District --</option>';
      districtSelect.disabled = true;
    }
    if (governorName) governorName.value = '';
    if (famousCulture) famousCulture.value = '';
    if (population) population.value = '';
    if (area) area.value = '';
    if (description) description.value = '';
    if (mapIframe) mapIframe.value = '';
    if (charCount) charCount.textContent = '0';
    if (imagesGallery) imagesGallery.innerHTML = '<p class="empty-message">No images uploaded yet</p>';
    if (mapPreview) mapPreview.innerHTML = '<div class="map-placeholder">No map configured</div>';
    
    updateStepButtons();
  } catch (error) {
    console.error('Error in resetMultiStepForm:', error);
  }
}

async function uploadDetailImages(files) {
  try {
    for (const file of files) {
      const base64 = await fileToBase64(file);
      detailImages.push(base64);
    }
    loadDetailImages();
    showNotification(`${files.length} image(s) uploaded!`);
  } catch (error) {
    console.error('Error uploading images:', error);
    showNotification('Error uploading images', 'error');
  }
}

function loadDetailImages() {
  const gallery = document.getElementById('detailImagesGallery');
  
  if (detailRegion && detailDistrict) {
    const districtData = getDistrict(detailRegion, detailDistrict);
    if (districtData && districtData.images && districtData.images.length > 0) {
      detailImages = [...districtData.images];
    }
  }
  
  if (detailImages.length === 0) {
    gallery.innerHTML = '<p class="empty-message">No images uploaded yet</p>';
    return;
  }
  
  gallery.innerHTML = '';
  
  detailImages.forEach((imageBase64, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    
    const img = document.createElement('img');
    img.src = imageBase64;
    img.alt = `Image ${index + 1}`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-image-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', () => {
      detailImages.splice(index, 1);
      loadDetailImages();
      showNotification('Image removed!');
    });
    
    imageItem.appendChild(img);
    imageItem.appendChild(deleteBtn);
    gallery.appendChild(imageItem);
  });
}


function executeDetailMapScript() {
  const mapContainer = document.getElementById('detailMapPreview');
  mapContainer.innerHTML = '';
  
  const mapScript = document.getElementById('detailMapScript').value;
  
  if (!mapScript.trim()) {
    mapContainer.innerHTML = '<div class="map-placeholder">No map script configured</div>';
    return;
  }
  
  try {
    if (window.detailMapInstance) {
      window.detailMapInstance.remove();
      window.detailMapInstance = null;
    }
    
    const modifiedScript = mapScript.replace(/'districtMap'/g, "'detailMapPreview'");
    const scriptFunction = new Function('L', modifiedScript);
    scriptFunction(window.L);
    
    if (window.mapInstance) {
      window.detailMapInstance = window.mapInstance;
    }
  } catch (error) {
    console.error('Error executing map script:', error);
    mapContainer.innerHTML = `<div class="map-error">Error: ${error.message}</div>`;
  }
}


function setupEditDistrictTabs() {
  const tabButtons = document.querySelectorAll('#editDistrictModal .tab-btn');
  const tabContents = document.querySelectorAll('#editDistrictModal .tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(`edit${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}Tab`).classList.add('active');
      
      if (targetTab === 'map' && currentEditRegion && currentEditDistrict) {
        setTimeout(() => updateEditMapPreview(), 100);
      }
    });
  });
}


async function fetchRegionsFromAPI() {
  try {
    const response = await fetch('https://dagmo-api.onrender.com/api/regions');
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data.map(region => region.name);
    }
    return [];
  } catch (error) {
    console.error('Error fetching regions from API:', error);
    showNotification('Error loading regions from API', 'error');
    return getRegions();
  }
}

async function fetchDistrictsFromAPI(regionName = null) {
  try {
    let url = 'https://dagmo-api.onrender.com/api/districts';
    if (regionName) {
      url += `?region=${encodeURIComponent(regionName)}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching districts from API:', error);
    showNotification('Error loading districts from API', 'error');
    if (regionName) {
      return getDistrictsByRegion(regionName);
    }
    return getDistricts();
  }
}

async function loadRegionsTable() {
  const regions = await fetchRegionsFromAPI();
  const districts = getDistricts();
  
  const tableBody = document.querySelector('#regionsTable tbody');
  
  tableBody.innerHTML = '';
  
  regions.forEach(function(region, index) {
    const regionData = districts[region];
    const districtCount = regionData && regionData.districts ? Object.keys(regionData.districts).length : 0;
    
    const row = document.createElement('tr');
    
    const idCell = document.createElement('td');
    idCell.textContent = index + 1;
    
    const nameCell = document.createElement('td');
    nameCell.textContent = region;
    
    const countCell = document.createElement('td');
    countCell.textContent = districtCount;
    
    const actionsCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-action delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('data-region', region);
    deleteBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete region "' + region + '"? This will also delete all districts in this region.')) {
        deleteRegion(region);
        loadRegionsTable();
        loadDistrictsTable();
        showNotification('Region deleted successfully!');
      }
    });
    actionsCell.appendChild(deleteBtn);
    
    row.appendChild(idCell);
    row.appendChild(nameCell);
    row.appendChild(countCell);
    row.appendChild(actionsCell);
    
    tableBody.appendChild(row);
  });
}


async function loadDistrictsTable() {
  const apiDistricts = await fetchDistrictsFromAPI();
  
  const tableBody = document.querySelector('#districtsTable tbody');
  
  tableBody.innerHTML = '';
  
  let id = 1;
  
  if (Array.isArray(apiDistricts)) {
    apiDistricts.forEach(function(district) {
      const regionName = district.region || district.region_name || district.regionName || '';
      const districtName = district.name || district.district_name || district.districtName || '';
      
      if (!regionName || !districtName) {
        console.warn('District missing region or name:', district);
        return;
      }
      
      const localDistrictData = getDistrict(regionName, districtName);
      
      const hasDetails = localDistrictData && localDistrictData.details && localDistrictData.details.trim() ? 'Yes' : 'No';
      const hasMap = localDistrictData && localDistrictData.mapScript && localDistrictData.mapScript.trim() ? 'Yes' : 'No';
      const imageCount = localDistrictData && localDistrictData.images ? localDistrictData.images.length : 0;
      
      const row = document.createElement('tr');
      
      const idCell = document.createElement('td');
      idCell.textContent = id++;
      
      const regionCell = document.createElement('td');
      regionCell.textContent = regionName;
      
      const districtCell = document.createElement('td');
      districtCell.textContent = districtName;
      
      const detailsCell = document.createElement('td');
      detailsCell.textContent = hasDetails;
      
      const mapCell = document.createElement('td');
      mapCell.textContent = hasMap;
      
      const imagesCell = document.createElement('td');
      imagesCell.textContent = imageCount;
      
      const actionsCell = document.createElement('td');
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-action edit';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('data-region', regionName);
      editBtn.setAttribute('data-district', districtName);
      editBtn.addEventListener('click', function() {
        showEditDistrictModal(regionName, districtName);
      });
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-action delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('data-region', regionName);
      deleteBtn.setAttribute('data-district', districtName);
      deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete district "' + districtName + '"?')) {
          deleteDistrict(regionName, districtName);
          loadDistrictsTable();
          showNotification('District deleted successfully!');
        }
      });
      
      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);
      
      row.appendChild(idCell);
      row.appendChild(regionCell);
      row.appendChild(districtCell);
      row.appendChild(detailsCell);
      row.appendChild(mapCell);
      row.appendChild(imagesCell);
      row.appendChild(actionsCell);
      
      tableBody.appendChild(row);
    });
  } else {
    const districts = typeof apiDistricts === 'object' && apiDistricts !== null ? apiDistricts : getDistricts();
    
    Object.keys(districts).forEach(function(region) {
      const regionData = districts[region];
      
      if (regionData && regionData.districts) {
        Object.keys(regionData.districts).forEach(function(district) {
          const districtData = regionData.districts[district];
          
          const hasDetails = districtData.details && districtData.details.trim() ? 'Yes' : 'No';
          const hasMap = districtData.mapScript && districtData.mapScript.trim() ? 'Yes' : 'No';
          const imageCount = districtData.images ? districtData.images.length : 0;
          
          const row = document.createElement('tr');
          
          const idCell = document.createElement('td');
          idCell.textContent = id++;
          
          const regionCell = document.createElement('td');
          regionCell.textContent = region;
          
          const districtCell = document.createElement('td');
          districtCell.textContent = district;
          
          const detailsCell = document.createElement('td');
          detailsCell.textContent = hasDetails;
          
          const mapCell = document.createElement('td');
          mapCell.textContent = hasMap;
          
          const imagesCell = document.createElement('td');
          imagesCell.textContent = imageCount;
          
          const actionsCell = document.createElement('td');
          
          const editBtn = document.createElement('button');
          editBtn.className = 'btn-action edit';
          editBtn.textContent = 'Edit';
          editBtn.setAttribute('data-region', region);
          editBtn.setAttribute('data-district', district);
          editBtn.addEventListener('click', function() {
            showEditDistrictModal(region, district);
          });
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn-action delete';
          deleteBtn.textContent = 'Delete';
          deleteBtn.setAttribute('data-region', region);
          deleteBtn.setAttribute('data-district', district);
          deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete district "' + district + '"?')) {
              deleteDistrict(region, district);
              loadDistrictsTable();
              showNotification('District deleted successfully!');
            }
          });
          
          actionsCell.appendChild(editBtn);
          actionsCell.appendChild(deleteBtn);
          
          row.appendChild(idCell);
          row.appendChild(regionCell);
          row.appendChild(districtCell);
          row.appendChild(detailsCell);
          row.appendChild(mapCell);
          row.appendChild(imagesCell);
          row.appendChild(actionsCell);
          
          tableBody.appendChild(row);
        });
      }
    });
  }
}

function loadUsersTable() {
  const users = getUsers();
  
  const tableBody = document.querySelector('#usersTable tbody');
  
  tableBody.innerHTML = '';
  
  users.forEach(function(user, index) {
    const row = document.createElement('tr');
    
    const idCell = document.createElement('td');
    idCell.textContent = index + 1;
    
    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    
    const emailCell = document.createElement('td');
    emailCell.textContent = user.email;
    
    const actionsCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-action delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('data-email', user.email);
    deleteBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete user "' + user.email + '"?')) {
        deleteUser(user.email);
        loadUsersTable();
        showNotification('User deleted successfully!');
      }
    });
    actionsCell.appendChild(deleteBtn);
    
    row.appendChild(idCell);
    row.appendChild(nameCell);
    row.appendChild(emailCell);
    row.appendChild(actionsCell);
    
    tableBody.appendChild(row);
  });
}

function showAddRegionModal() {
  document.getElementById('addRegionModal').style.display = 'flex';
  document.getElementById('newRegionName').focus();
}

async function showAddDistrictModal() {
  const regionSelect = document.getElementById('newDistrictRegion');
  const regions = await fetchRegionsFromAPI();
  
  regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
  regions.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });
  
  document.getElementById('addDistrictModal').style.display = 'flex';
}

function showAddUserModal() {
  document.getElementById('addUserModal').style.display = 'flex';
  document.getElementById('newUserName').focus();
}

async function showAddDetailsModal() {
  console.log('showAddDetailsModal called');
  
  const modal = document.getElementById('addDetailsModal');
  if (!modal) {
    console.error('addDetailsModal not found!');
    alert('Modal not found. Please refresh the page.');
    return;
  }
  
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  modal.classList.add('active');
  
  console.log('Modal display set to:', modal.style.display);
  console.log('Modal visibility:', modal.style.visibility);

  try {
    const regionSelect = document.getElementById('detailsRegionSelect');
    if (!regionSelect) {
      console.error('detailsRegionSelect not found!');
      return;
    }
    
    const regions = await fetchRegionsFromAPI();
    
    regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
    regions.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
    
    resetMultiStepForm();
    
    setTimeout(() => {
      const focusEl = document.getElementById('detailsRegionSelect');
      if (focusEl) focusEl.focus();
    }, 100);
  } catch (error) {
    console.error('Error in showAddDetailsModal:', error);
  }
}

async function loadDistrictsForDetails(region) {
  const districtSelect = document.getElementById('detailsDistrictSelect');
  
  const apiDistricts = await fetchDistrictsFromAPI(region);
  
  districtSelect.innerHTML = '<option value="">-- Select District --</option>';
  
  if (Array.isArray(apiDistricts)) {
    apiDistricts.forEach(district => {
      const districtName = district.name || district.district_name || district.districtName || '';
      
      if (!districtName) {
        console.warn('District missing name:', district);
        return;
      }
      
      const option = document.createElement('option');
      option.value = districtName;
      option.textContent = districtName;
      
      const districtData = getDistrict(region, districtName);
      if (districtData && districtData.details && districtData.details.trim()) {
        option.textContent += ' (has details)';
      }
      
      districtSelect.appendChild(option);
    });
  } else {
    const districts = typeof apiDistricts === 'object' && apiDistricts !== null ? apiDistricts : getDistrictsByRegion(region);
    const districtNames = Object.keys(districts);
    
    districtNames.forEach(district => {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      
      const districtData = getDistrict(region, district);
      if (districtData && districtData.details && districtData.details.trim()) {
        option.textContent += ' (has details)';
      }
      
      districtSelect.appendChild(option);
    });
  }
}

function showEditDistrictModal(region, district) {
  currentEditRegion = region;
  currentEditDistrict = district;
  
  const districtData = getDistrict(region, district);
  
  if (districtData) {
    const details = districtData.details || '';
    document.getElementById('editDistrictDetails').value = details;
    document.getElementById('editCharCount').textContent = details.length.toLocaleString();
    const mapIframe = districtData.mapScript || '';
    document.getElementById('editMapScript').value = mapIframe;
    loadEditImages(districtData.images || []);
    
    if (mapIframe) {
      setTimeout(() => updateEditMapPreview(), 100);
    }
  }
  
  document.querySelectorAll('#editDistrictModal .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('#editDistrictModal .tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector('#editDistrictModal .tab-btn[data-tab="details"]').classList.add('active');
  document.getElementById('editDetailsTab').classList.add('active');
  
  document.getElementById('editDistrictModal').style.display = 'flex';
}

function loadEditImages(images) {
  const gallery = document.getElementById('editImagesGallery');
  
  if (images.length === 0) {
    gallery.innerHTML = '<p class="empty-message">No images uploaded</p>';
    return;
  }
  
  gallery.innerHTML = '';
  
  images.forEach((imageBase64, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    
    const img = document.createElement('img');
    img.src = imageBase64;
    img.alt = `Image ${index + 1}`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-image-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', () => {
      removeDistrictImage(currentEditRegion, currentEditDistrict, index);
      loadEditImages(getDistrict(currentEditRegion, currentEditDistrict).images || []);
      showNotification('Image deleted!');
      loadDistrictsTable();
    });
    
    imageItem.appendChild(img);
    imageItem.appendChild(deleteBtn);
    gallery.appendChild(imageItem);
  });
}

async function uploadImages(files) {
  try {
    for (const file of files) {
      const base64 = await fileToBase64(file);
      addDistrictImage(currentEditRegion, currentEditDistrict, base64);
    }
    
    const districtData = getDistrict(currentEditRegion, currentEditDistrict);
    loadEditImages(districtData.images || []);
    showNotification(`${files.length} image(s) uploaded!`);
    loadDistrictsTable();
  } catch (error) {
    console.error('Error uploading images:', error);
    showNotification('Error uploading images', 'error');
  }
}

function updateEditMapPreview() {
  const mapContainer = document.getElementById('editMapPreview');
  if (!mapContainer) return;
  
  const mapIframe = document.getElementById('editMapScript').value.trim();
  
  if (!mapIframe) {
    mapContainer.innerHTML = '<div class="map-placeholder">No map configured</div>';
    return;
  }
  
  let iframeHtml = mapIframe;
  
  if (mapIframe.startsWith('http')) {
    iframeHtml = `<iframe src="${mapIframe}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  } else if (mapIframe.includes('<iframe')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mapIframe;
    const iframe = tempDiv.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframeHtml = iframe.outerHTML;
    }
  }
  
  mapContainer.innerHTML = iframeHtml;
}


function deleteRegion(region) {
  const districts = getDistricts();
  delete districts[region];
  setDistricts(districts);
}


function deleteDistrict(region, district) {
  const districts = getDistricts();
  if (districts[region] && districts[region].districts) {
    delete districts[region].districts[district];
    setDistricts(districts);
  }
}


function addUser(name, email, password) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showNotification('User with this email already exists!', 'error');
    return;
  }
  users.push({ name, email, password });
  setUsers(users);
}


function deleteUser(email) {
  const users = getUsers();
  const filtered = users.filter(u => u.email !== email);
  setUsers(filtered);
}


function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
