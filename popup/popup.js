document.addEventListener('DOMContentLoaded', () => {
  // Assuming third-party requests are stored in localStorage or an in-memory store
  const domainsList = document.getElementById('domainsList');
  const thirdPartyDomains = JSON.parse(localStorage.getItem('thirdPartyDomains')) || [];

  thirdPartyDomains.forEach(domain => {
    const listItem = document.createElement('div');
    listItem.textContent = domain;
    domainsList.appendChild(listItem);
  });
});
