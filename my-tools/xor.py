def xor(a, b):
    byteA = bytes.fromhex(a)
    byteB = bytes.fromhex(chr(int(b, 16)).encode('utf-8').hex())
    result = bytes(x ^ y for x, y in zip(byteA, byteB))
    return result.hex()

if __name__ == "__main__":
    letter = input("Enter the first letter (in HEX format): ").strip()
    num = input("Enter the second number (in HEX format): ").strip()
    hex_result = xor(letter, num)
    print(f"The XOR hex result is: {hex_result}")
    try:
        print(f"As ASCII character: {bytes.fromhex(hex_result).decode()}")
    except Exception:
        pass