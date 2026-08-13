from typing import Optional

def decrypt_caesar_cipher(ciphertext,shift:Optional[int]):
    if shift is None:
        all_cypher_text = []
        for i in range(1,26):
            decrypted_text = ""
            for char in ciphertext:
                if char.isalpha():
                    shifted = ord(char) - i
                    if char.islower():
                        if shifted < ord('a'):
                            shifted += 26
                    elif char.isupper():
                        if shifted < ord('A'):
                            shifted += 26
                    decrypted_text += chr(shifted)
                else:
                    decrypted_text += char
            all_cypher_text.append((i, decrypted_text))
        print("Possible decryptions with all shifts:")
        for shift_value, decrypted in all_cypher_text:
            print(f"Shift {shift_value}: {decrypted}")
    else:
        decrypted_text = ""
        for char in ciphertext:
            if char.isalpha():
                shifted = ord(char) - shift
                if char.islower():
                    if shifted < ord('a'):
                        shifted += 26
                elif char.isupper():
                    if shifted < ord('A'):
                        shifted += 26
                decrypted_text += chr(shifted)
            else:
                decrypted_text += char
        print(f"Decrypted text with shift {shift}: {decrypted_text}")

if __name__ == '__main__':
    ciphertext = input("Enter the ciphertext: ")
    shift_input = input("Enter the shift value (or leave blank to try all shifts): ")
    shift = int(shift_input) if shift_input else None
    decrypt_caesar_cipher(ciphertext, shift)