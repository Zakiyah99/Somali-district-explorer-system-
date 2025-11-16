
let currentRegion = "";
let currentDistrict = "";

document.addEventListener("DOMContentLoaded", function () {
  
  initializeStorage();

  
  setTimeout(function () {
    initializeRegions();
    setupEventListeners();
  }, 100);
});


function initializeRegions() {
  const regionSelect = document.getElementById("regionSelect");
  const regions = getRegions();
  regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
  regions.forEach(function (region) {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });
}

function setupEventListeners() {
  const regionSelect = document.getElementById("regionSelect");
  regionSelect.addEventListener("change", function () {
    currentRegion = this.value;
    if (currentRegion) {
      loadDistricts(currentRegion);
      document.getElementById("districtSelect").disabled = false;
    } else {
      document.getElementById("districtSelect").innerHTML =
        '<option value="">-- Select District --</option>';
      document.getElementById("districtSelect").disabled = true;
      hideContentPanel();
      showEmptyState();
    }
  });

  const districtSelect = document.getElementById("districtSelect");
  districtSelect.addEventListener("change", function () {
    currentDistrict = this.value;
    if (currentRegion && currentDistrict) {
      loadDistrictData(currentRegion, currentDistrict);
      showContentPanel();
      hideEmptyState();
    } else {
      hideContentPanel();
      showEmptyState();
    }
  });
}

function loadDistricts(region) {
  const districtSelect = document.getElementById("districtSelect");
  const districts = getDistrictsByRegion(region);
  const districtNames = Object.keys(districts);
  districtSelect.innerHTML = '<option value="">-- Select District --</option>';
  districtNames.forEach(function (district) {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    districtSelect.appendChild(option);
  });
  districtSelect.disabled = false;
}

function loadDistrictData(region, district) {
  const districtData = getDistrict(region, district);
  if (districtData) {
    let detailsToDisplay = districtData.details;
    if (typeof detailsToDisplay === "object" && detailsToDisplay !== null) {
      displayDetails(JSON.stringify(detailsToDisplay));
    } else {
      displayDetails(
        detailsToDisplay || "No details available for this district."
      );
    }
    displayImages(districtData.images || []);
    executeMapScript(districtData.mapScript || "");
  } else {
    displayDetails("No information available for this district.");
    displayImages([]);
    clearMap();
  }
}

function displayDetails(details) {
  const detailsContainer = document.getElementById("districtDetails");
  if (!details || !details.trim()) {
    detailsContainer.innerHTML =
      '<p class="empty-message">No details available for this district.</p>';
    return;
  }

  let detailsObj;
  try {
    detailsObj = JSON.parse(details);
  } catch (e) {
    if (
      details.includes("Governor:") ||
      details.includes("Governor Name:") ||
      details.includes("Famous Culture:") ||
      details.includes("Population:") ||
      details.includes("Area:") ||
      details.includes("Description:")
    ) {
      detailsObj = parseStructuredText(details);
    } else {
      const formattedDetails = details.replace(/\n/g, "<br>");
      detailsContainer.innerHTML =
        '<div class="details-text">' + formattedDetails + "</div>";
      return;
    }
  }

  if (detailsObj && typeof detailsObj === "object") {
    displayStructuredDetails(detailsObj, detailsContainer);
  } else {
    const formattedDetails = details.replace(/\n/g, "<br>");
    detailsContainer.innerHTML =
      '<div class="details-text">' + formattedDetails + "</div>";
  }
}

function parseStructuredText(text) {
  const obj = {};
  const lines = text.split("\n");
  let inDescription = false;
  let descriptionLines = [];

  lines.forEach(function (line) {
    const trimmed = line.trim();

    if (
      trimmed.startsWith("Governor:") ||
      trimmed.startsWith("Governor Name:")
    ) {
      obj.governorName = trimmed.split(":")[1].trim() || "";
      inDescription = false;
    } else if (trimmed.startsWith("Famous Culture:")) {
      obj.famousCulture = trimmed.split(":")[1].trim() || "";
      inDescription = false;
    } else if (trimmed.startsWith("Population:")) {
      obj.population = trimmed.split(":")[1].trim() || "";
      inDescription = false;
    } else if (trimmed.startsWith("Area:")) {
      obj.area = trimmed.split(":")[1].trim() || "";
      inDescription = false;
    } else if (trimmed.startsWith("Description:")) {
      inDescription = true;
      const descText = trimmed.split(":")[1].trim() || "";
      if (descText) {
        descriptionLines.push(descText);
      }
    } else if (inDescription && trimmed) {
      descriptionLines.push(trimmed);
    } else if (inDescription) {
      descriptionLines.push("");
    }
  });

  if (descriptionLines.length > 0) {
    obj.description = descriptionLines.join("\n");
  }

  return obj;
}

function displayStructuredDetails(detailsObj, container) {
  const details = detailsObj.details || detailsObj;

  
  let html = '<div class="details-grid">';

  
  if (details.governorName || details["Governor Name"]) {
    html += '<div class="detail-item">';
    html +=
      '<div class="detail-label"><i class="fas fa-user-tie"></i><span>Governor Name</span></div>';
    html +=
      '<div class="detail-value">' +
      (details.governorName || details["Governor Name"] || "Not specified") +
      "</div>";
    html += "</div>";
  }

  
  if (details.famousCulture || details["Famous Culture"]) {
    html += '<div class="detail-item">';
    html +=
      '<div class="detail-label"><i class="fas fa-theater-masks"></i><span>Famous Culture</span></div>';
    html +=
      '<div class="detail-value">' +
      (details.famousCulture || details["Famous Culture"] || "Not specified") +
      "</div>";
    html += "</div>";
  }

  
  if (details.population || details["Population"]) {
    html += '<div class="detail-item">';
    html +=
      '<div class="detail-label"><i class="fas fa-users"></i><span>Population</span></div>';
    html +=
      '<div class="detail-value">' +
      (details.population || details["Population"] || "Not specified") +
      "</div>";
    html += "</div>";
  }

  
  if (details.area || details["Area"]) {
    html += '<div class="detail-item">';
    html +=
      '<div class="detail-label"><i class="fas fa-map"></i><span>Area</span></div>';
    html +=
      '<div class="detail-value">' +
      (details.area || details["Area"] || "Not specified") +
      "</div>";
    html += "</div>";
  }

  
  if (details.description || details["Description"]) {
    const desc = (details.description || details["Description"] || "").replace(
      /\n/g,
      "<br>"
    );
    html += '<div class="detail-description">';
    html +=
      '<div class="detail-label"><i class="fas fa-info-circle"></i><span>Description</span></div>';
    html +=
      '<div class="detail-value">' +
      (desc || "No description available.") +
      "</div>";
    html += "</div>";
  }

  html += "</div>";

  
  if (html === '<div class="details-grid"></div>') {
    const formattedDetails = JSON.stringify(detailsObj, null, 2).replace(
      /\n/g,
      "<br>"
    );
    container.innerHTML =
      '<div class="details-text">' + formattedDetails + "</div>";
  } else {
    
    container.innerHTML = html;
  }
}

function displayImages(images) {
  const gallery = document.getElementById("imagesGallery");

  
  if (images.length === 0) {
    gallery.innerHTML =
      '<p class="empty-message">No images available for this district.</p>';
    return;
  }

  
  gallery.innerHTML = "";

  
  images.forEach(function (imageBase64, index) {
    
    const imageItem = document.createElement("div");
    imageItem.className = "image-item";

    
    const img = document.createElement("img");
    img.src = imageBase64; 
    img.alt = "District image " + (index + 1);
    img.loading = "lazy"; 

    
    img.addEventListener("click", function () {
      showImageModal(imageBase64);
    });

    
    imageItem.appendChild(img);
    gallery.appendChild(imageItem);
  });
}

function executeMapScript(mapIframe) {
  const mapContainer = document.getElementById("districtMap");

  
  mapContainer.innerHTML = "";

  
  if (!mapIframe || !mapIframe.trim()) {
    mapContainer.innerHTML =
      '<div class="map-placeholder">No map available for this district.</div>';
    return;
  }

  let iframeHtml = mapIframe;

  
  if (mapIframe.startsWith("http")) {
    iframeHtml =
      '<iframe src="' +
      mapIframe +
      '" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
  }
  
  else if (mapIframe.includes("<iframe")) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = mapIframe;
    const iframe = tempDiv.querySelector("iframe");
    if (iframe) {
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframeHtml = iframe.outerHTML;
    }
  }

  
  mapContainer.innerHTML = iframeHtml;
}

function clearMap() {
  const mapContainer = document.getElementById("districtMap");
  mapContainer.innerHTML =
    '<div class="map-placeholder">No map available for this district.</div>';
}

function showContentPanel() {
  document.getElementById("contentPanel").style.display = "block";
}

function hideContentPanel() {
  document.getElementById("contentPanel").style.display = "none";
  clearMap();
}

function showEmptyState() {
  document.getElementById("emptyState").style.display = "flex";
}

function hideEmptyState() {
  document.getElementById("emptyState").style.display = "none";
}

function showImageModal(imageSrc) {
  
  let modal = document.getElementById("imageModal");

  
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "imageModal";
    modal.className = "image-modal";
    modal.innerHTML =
      '<div class="image-modal-content">' +
      '<button class="image-modal-close">&times;</button>' +
      '<img id="modalImage" src="" alt="Full size image">' +
      "</div>";
    document.body.appendChild(modal);

    
    const closeBtn = modal.querySelector(".image-modal-close");
    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });

    
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  
  document.getElementById("modalImage").src = imageSrc;
  modal.style.display = "flex";
}
