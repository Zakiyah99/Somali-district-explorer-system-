
function initializeStorage() {
  const defaultUsers = [
    { email: "omartood@gmail.com", password: "omar123", name: "Omar Tood" },
    { email: "zakia@gmail.com", password: "zakia123", name: "Zakia Said" }
  ];

  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }

  fetch('../../data/users.json')
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to fetch users.json');
    })
    .then(users => {
      if (users && Array.isArray(users) && users.length > 0) {
        localStorage.setItem('users', JSON.stringify(users));
      }
    })
    .catch(error => {
      console.error('Error loading users from file:', error);
    });

  
  if (!localStorage.getItem('districts')) {
    fetch('../../data/districts.json')
      .then(response => response.json())
      .then(districts => {
        localStorage.setItem('districts', JSON.stringify(districts));
      })
      .catch(error => {
        console.error('Error loading districts:', error);
        
      
      });
  }
}


function getUsers() {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}


function getDistricts() {
  const districts = localStorage.getItem('districts');
  return districts ? JSON.parse(districts) : {};
}

function setDistricts(districts) {
  localStorage.setItem('districts', JSON.stringify(districts));
}

function getRegions() {
  const districts = getDistricts();
  return Object.keys(districts);
}


function getDistrictsByRegion(region) {
  const districts = getDistricts();
  if (districts[region] && districts[region].districts) {
    return districts[region].districts;
  }
  return {};
}

function getDistrict(region, district) {
  const districts = getDistricts();
  if (districts[region] && districts[region].districts && districts[region].districts[district]) {
    return districts[region].districts[district];
  }
  return null;
}


function setDistrict(region, district, districtData) {
  const districts = getDistricts();
  
  
  if (!districts[region]) {
    districts[region] = { districts: {} };
  }
  
  
  if (!districts[region].districts) {
    districts[region].districts = {};
  }
  
  
  districts[region].districts[district] = {
    details: districtData.details || '',
    mapScript: districtData.mapScript || '',
    images: districtData.images || []
  };
  
  setDistricts(districts);
}


function updateDistrictDetails(region, district, details) {
  const districtData = getDistrict(region, district) || { details: '', mapScript: '', images: [] };
  districtData.details = details;
  setDistrict(region, district, districtData);
}


function updateDistrictMapScript(region, district, mapScript) {
  const districtData = getDistrict(region, district) || { details: '', mapScript: '', images: [] };
  districtData.mapScript = mapScript;
  setDistrict(region, district, districtData);
}


function addDistrictImage(region, district, imageBase64) {
  const districtData = getDistrict(region, district) || { details: '', mapScript: '', images: [] };
  if (!districtData.images) {
    districtData.images = [];
  }
  districtData.images.push(imageBase64);
  setDistrict(region, district, districtData);
}


function removeDistrictImage(region, district, imageIndex) {
  const districtData = getDistrict(region, district);
  if (districtData && districtData.images) {
    districtData.images.splice(imageIndex, 1);
    setDistrict(region, district, districtData);
  }
}


function addDistrict(region, district) {
  const districtData = {
    details: '',
    mapScript: '',
    images: []
  };
  setDistrict(region, district, districtData);
}


function addRegion(region) {
  const districts = getDistricts();
  if (!districts[region]) {
    districts[region] = { districts: {} };
    setDistricts(districts);
  }
}


function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


if (typeof window !== 'undefined') {
  initializeStorage();
}
