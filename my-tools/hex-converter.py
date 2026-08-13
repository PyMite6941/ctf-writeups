import base64

def hex_decoding(hex_code):
    return bytes.fromhex(hex_code)

def hex_encoding(hex_code):
    return base64.b64encode(bytes.fromhex(hex_code))

if __name__ == '__main__':
    hex_code = input("Enter the hexadecimal code: ")
    choice = input("Do you want to decode (d) or encode (e)? ")
    if choice.lower() == 'd':
        byte_data = hex_decoding(hex_code)
        print(f"The byte representation of the hexadecimal code is: {byte_data}")
    elif choice.lower() == 'e':
        encoded_data = hex_encoding(hex_code)
        print(f"The base64 encoded representation of the hexadecimal code is: {encoded_data}")