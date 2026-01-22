const products = [
    {
      id: '1',
      name: 'Nike Air Max 270',
      category: 'Men\'s Shoes',
      price: 150,
      salePrice: 75,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/cb1951e7-0600-4f7a-9b26-12be8cd2bd01/W+AIR+MAX+270.png',
      colors: 5,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '2',
      name: 'Nike Air Force 1 \'07',
      category: 'Men\'s Shoes',
      price: 110,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/AIR+FORCE+1+%2707.png',
      colors: 3,
      isNewArrival: false,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '3',
      name: 'Nike Dunk Low',
      category: 'Men\'s Shoes',
      price: 110,
      salePrice: 89.97,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/00784f5d-2b07-4758-a6f6-14cd7ce4c8e1/W+NIKE+DUNK+LOW.png',
      colors: 1,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '4',
      name: 'Nike Invincible 3',
      category: 'Men\'s Road Running Shoes',
      price: 180,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/9dcdc903-2860-4efa-81bd-ffffeb788e47/ZOOMX+INVINCIBLE+RUN+3+WIDE.png',
      colors: 4,
      isNewArrival: true,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '5',
      name: 'Nike Air VaporMax 2023 Flyknit',
      category: 'Men\'s Shoes',
      price: 210,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/a108aee1-874a-486b-a5e8-7a8cc84fc373/AIR+VAPORMAX+2023+FK.png',
      colors: 2,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '6',
      name: 'Nike Air Max 90',
      category: 'Men\'s Shoes',
      price: 130,
      salePrice: 97.97,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/8cc40f5a-3693-4976-9ce0-70ec9687889b/WMNS+AIR+MAX+90.png',
      colors: 3,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '7',
      name: 'Nike Pegasus 40',
      category: 'Men\'s Road Running Shoes',
      price: 130,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/1abaae51-d7c4-4ca6-8e2b-8133b90d168b/AIR+ZOOM+PEGASUS+40.png',
      colors: 7,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '8',
      name: 'Nike Metcon 9',
      category: 'Men\'s Training Shoes',
      price: 150,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/2a14bf14-2d2c-49a3-b168-2a8e150acb4c/NIKE+METCON+9.png',
      colors: 5,
      isNewArrival: true,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '9',
      name: 'Nike Blazer Mid \'77 Vintage',
      category: 'Men\'s Shoes',
      price: 105,
      image: 'https://static.nike.com/a/images/t_default/fb7eda3c-5ac8-4d05-a18f-1c2c5e82e36e/BLAZER+MID+%2777+VNTG.png',
      colors: 2,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '10',
      name: 'Nike Cortez',
      category: 'Men\'s Shoes',
      price: 90,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/0c2ecdfd-df75-4d38-b6de-76a3bfa117e4/NIKE+CORTEZ.png',
      colors: 3,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '11',
      name: 'Nike SB Dunk Low Pro',
      category: 'Skate Shoes',
      price: 115,
      image: 'https://static.nike.com/a/images/w_1280,q_auto,f_auto/2cdc9e01-82df-448c-8119-3769a7aa47cd/sb-dunk-low-pro-chicago-release-date.jpg',
      colors: 1,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
    {
      id: '12',
      name: 'Nike SuperRep Go 3',
      category: 'Men\'s Workout Shoes',
      price: 100,
      salePrice: 79,
      image: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/0269de29-4aaf-4850-9c4e-29601b419bf1/M+NIKE+SUPERREP+GO+3+NN+FK.png',
      colors: 2,
      sizes: [
        4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5,
        8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
        12, 12.5, 13
      ],
      description: "Vừa vặn; nếu bạn thích mặc rộng hơn một chút, chúng tôi khuyên bạn nên đặt hàng lớn hơn nửa size.",
      shipping: "Bạn sẽ thấy các tùy chọn giao hàng của chúng tôi khi thanh toán.",
    },
  ];

export default products;