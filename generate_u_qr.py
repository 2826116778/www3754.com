import qrcode

addr = 'TXRR6yqPVaKKnrHvxxNFvDGsU6DeENMS8Q'
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
qr.add_data(addr)
qr.make(fit=True)
img = qr.make_image(fill_color='black', back_color='white')
img.save('u-payment-qrcode.png')
print('saved u-payment-qrcode.png')
