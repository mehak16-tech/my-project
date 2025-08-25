 const dropdown = document.getElementById("category");
    const products = document.querySelectorAll(".product");

    dropdown.addEventListener("change", function() {
      const selected = this.value;

      products.forEach(product => {
        if (selected === "All" || product.dataset.category === selected) {
          product.style.display = "block";
        } else {
          product.style.display = "none";
        }
      });
    });
