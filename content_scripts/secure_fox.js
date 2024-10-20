const trackThirdPartyDomains = (details) => {
    const initiatorDomain = details.initiator ? new URL(details.initiator).hostname : 'Unknown';
    const requestDomain = new URL(details.url).hostname;
  
    if (initiatorDomain !== requestDomain) {
      console.log(`Third-party request detected: ${requestDomain}`);
      
      // Retrieve existing third-party domains or initialize as an empty array
      let thirdPartyDomains = JSON.parse(localStorage.getItem("thirdPartyDomains")) || [];
      
      // Add the new domain to the array
      thirdPartyDomains.push(requestDomain);
      
      // Store the updated array back in localStorage
      localStorage.setItem("thirdPartyDomains", JSON.stringify(thirdPartyDomains));
    } else {
        console.log("nada")
    }
  };
  
  // Register event listener
  browser.webRequest.onBeforeRequest.addListener(
    trackThirdPartyDomains,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );