export default {
  propercase: text => text.split('').map((item, index) => (index === 0 ? item.toUpperCase() : item)).join(''),
  timeout: ms => new Promise(resolve => setTimeout(resolve, ms)),
  checkErrorForLogout: (error, router) => {
    if (error.status === 401) {
      alert("Your session has expired, please login again");
      router.replace(`/logout`);
    } else {
      alert(error.message);
    }
  }
};
