// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   Platform,
// } from 'react-native';
// import { useQuery, useMutation } from 'convex/react';
// import { api } from '@/convex/_generated/api';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { router } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import { Id } from '@/convex/_generated/dataModel';
// import Header from '@/components/Header';
// import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';

// interface User {
//   userId: string;
//   role: string;
//   firstName: string;
//   lastName: string;
//   email: string;
// }

// export default function UploadResumeScreen() {
//   const [user, setUser] = useState<User | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [selectedFile, setSelectedFile] = useState<any>(null);

//   const candidateProfile = useQuery(
//     api.candidate.getCandidateProfile,
//     user ? { userId: user.userId as Id<'users'> } : 'skip'
//   );

//   const uploadResume = useMutation(api.files.uploadResume);
//   const updateCandidateProfile = useMutation(api.candidate.updateCandidateProfile);

//   useEffect(() => {
//     loadUserData();
//   }, []);

//   const loadUserData = async () => {
//     try {
//       const userData = await AsyncStorage.getItem('user');
//       if (userData) {
//         const parsedUser = JSON.parse(userData);
//         if (parsedUser.role !== 'candidate') {
//           Alert.alert('Access Denied', 'This section is for candidates only');
//           router.replace('/dashboard/hr');
//           return;
//         }
//         setUser(parsedUser);
//       } else {
//         router.replace('/auth/login');
//       }
//     } catch (error) {
//       console.error('Error loading user data:', error);
//       router.replace('/auth/login');
//     }
//   };

//   const pickDocument = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: [
//           'application/pdf',
//           'application/msword',
//           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         ],
//         copyToCacheDirectory: true,
//       });

//       if (!result.canceled && result.assets[0]) {
//         const file = result.assets[0];

//         // Check file size (limit to 5MB)
//         if (file.size && file.size > 5 * 1024 * 1024) {
//           Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
//           return;
//         }

//         setSelectedFile(file);
//       }
//     } catch (error) {
//       console.error('Error picking document:', error);
//       Alert.alert('Error', 'Failed to pick document');
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedFile || !user) {
//       Alert.alert('Error', 'Please select a file first');
//       return;
//     }

//     setUploading(true);
//     try {
//       // Read file as base64 string
//       let fileData = '';
//       if (Platform.OS === 'android') {
//         const response = await fetch(selectedFile.uri);
//         const blob = await response.blob();
//         fileData = await new Promise<string>((resolve, reject) => {
//           const reader = new FileReader();
//           reader.onloadend = () => resolve(reader.result as string);
//           reader.onerror = reject;
//           reader.readAsDataURL(blob);
//         });

//         fileData = fileData.split(',')[1];
//       } else {
//         fileData = await FileSystem.readAsStringAsync(selectedFile.uri, {
//           encoding: FileSystem.EncodingType.Base64,
//         });
//       }

//       await uploadResume({
//         userId: user.userId as Id<'users'>,
//         fileName: selectedFile.name,
//         fileData,
//         mimeType: selectedFile.mimeType,
//       });

//       Alert.alert('Success', 'Resume uploaded successfully!', [
//         { text: 'OK', onPress: () => router.replace('/dashboard/hr') },
//       ]);

//       setSelectedFile(null);
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload resume');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const removeCurrentResume = async () => {
//     if (!user) return;

//     Alert.alert('Remove Resume', 'Are you sure you want to remove your current resume?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Remove',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             await updateCandidateProfile({
//               userId: user.userId as Id<'users'>,
//             });
//             Alert.alert('Success', 'Resume removed successfully');
//           } catch (error) {
//             Alert.alert('Error', 'Failed to remove resume');
//           }
//         },
//       },
//     ]);
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const getFileIcon = (mimeType: string) => {
//     if (mimeType.includes('pdf')) return 'document-text';
//     if (mimeType.includes('word')) return 'document';
//     return 'document-outline';
//   };

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <Text>Loading...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <Header title="Upload Resume" showBack={true} />

//       <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
//         {/* Current Resume Status */}
//         <View style={styles.statusCard}>
//           <View style={styles.statusHeader}>
//             <Ionicons
//               name={candidateProfile?.resumeId ? 'checkmark-circle' : 'alert-circle'}
//               size={24}
//               color={candidateProfile?.resumeId ? '#10B981' : '#F59E0B'}
//             />
//             <Text style={styles.statusTitle}>
//               {candidateProfile?.resumeId ? 'Resume Uploaded' : 'No Resume Uploaded'}
//             </Text>
//           </View>
//           <Text style={styles.statusDescription}>
//             {candidateProfile?.resumeId
//               ? 'You have a resume on file. Upload a new one to replace it.'
//               : 'Upload your resume to improve your job application success rate.'}
//           </Text>

//           {candidateProfile?.resumeId && (
//             <View style={styles.currentResumeActions}>
//               <TouchableOpacity style={styles.viewResumeButton}>
//                 <Ionicons name="eye" size={16} color="#3B82F6" />
//                 <Text style={styles.viewResumeText}>View Current Resume</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.removeResumeButton} onPress={removeCurrentResume}>
//                 <Ionicons name="trash" size={16} color="#EF4444" />
//                 <Text style={styles.removeResumeText}>Remove</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>

//         {/* Upload Instructions */}
//         <View style={styles.instructionsCard}>
//           <Text style={styles.instructionsTitle}>Upload Guidelines</Text>
//           <View style={styles.instructionsList}>
//             <View style={styles.instructionItem}>
//               <Ionicons name="checkmark" size={16} color="#10B981" />
//               <Text style={styles.instructionText}>Supported formats: PDF, DOC, DOCX</Text>
//             </View>
//             <View style={styles.instructionItem}>
//               <Ionicons name="checkmark" size={16} color="#10B981" />
//               <Text style={styles.instructionText}>Maximum file size: 5MB</Text>
//             </View>
//             <View style={styles.instructionItem}>
//               <Ionicons name="checkmark" size={16} color="#10B981" />
//               <Text style={styles.instructionText}>Include your contact information</Text>
//             </View>
//             <View style={styles.instructionItem}>
//               <Ionicons name="checkmark" size={16} color="#10B981" />
//               <Text style={styles.instructionText}>Keep it concise and relevant</Text>
//             </View>
//           </View>
//         </View>

//         {/* File Selection */}
//         {selectedFile ? (
//           <View style={styles.selectedFileCard}>
//             <View style={styles.fileInfo}>
//               <View style={styles.fileIcon}>
//                 <Ionicons
//                   name={getFileIcon(selectedFile.mimeType) as any}
//                   size={32}
//                   color="#3B82F6"
//                 />
//               </View>
//               <View style={styles.fileDetails}>
//                 <Text style={styles.fileName}>{selectedFile.name}</Text>
//                 <Text style={styles.fileSize}>
//                   {selectedFile.size ? formatFileSize(selectedFile.size) : 'Unknown size'}
//                 </Text>
//                 <Text style={styles.fileType}>{selectedFile.mimeType}</Text>
//               </View>
//               <TouchableOpacity
//                 style={styles.removeFileButton}
//                 onPress={() => setSelectedFile(null)}
//               >
//                 <Ionicons name="close" size={20} color="#6B7280" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         ) : (
//           <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
//             <View style={styles.uploadIcon}>
//               <Ionicons name="cloud-upload" size={48} color="#9CA3AF" />
//             </View>
//             <Text style={styles.uploadTitle}>Choose Resume File</Text>
//             <Text style={styles.uploadDescription}>Tap to browse and select your resume file</Text>
//             <View style={styles.uploadFormats}>
//               <Text style={styles.formatText}>PDF, DOC, DOCX</Text>
//             </View>
//           </TouchableOpacity>
//         )}

//         {/* Upload Button */}
//         {selectedFile && (
//           <TouchableOpacity
//             style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
//             onPress={handleUpload}
//             disabled={uploading}
//           >
//             <Text style={styles.uploadButtonText}>
//               {uploading ? 'Uploading...' : 'Upload Resume'}
//             </Text>
//             {!uploading && <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />}
//           </TouchableOpacity>
//         )}

//         {/* Tips Section */}
//         <View style={styles.tipsCard}>
//           <Text style={styles.tipsTitle}>💡 Resume Tips</Text>
//           <View style={styles.tipsList}>
//             <Text style={styles.tipText}>• Use a clean, professional format</Text>
//             <Text style={styles.tipText}>• Highlight relevant skills and experience</Text>
//             <Text style={styles.tipText}>• Include quantifiable achievements</Text>
//             <Text style={styles.tipText}>• Proofread for spelling and grammar</Text>
//             <Text style={styles.tipText}>• Keep it to 1-2 pages maximum</Text>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 24,
//   },
//   statusCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   statusHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statusTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1F2937',
//     marginLeft: 12,
//   },
//   statusDescription: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 20,
//     marginBottom: 16,
//   },
//   currentResumeActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   viewResumeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#EBF8FF',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     flex: 1,
//   },
//   viewResumeText: {
//     fontSize: 14,
//     color: '#3B82F6',
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   removeResumeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FEF2F2',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   removeResumeText: {
//     fontSize: 14,
//     color: '#EF4444',
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   instructionsCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   instructionsTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1F2937',
//     marginBottom: 16,
//   },
//   instructionsList: {
//     gap: 12,
//   },
//   instructionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   instructionText: {
//     fontSize: 14,
//     color: '#374151',
//     marginLeft: 12,
//     flex: 1,
//   },
//   uploadArea: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 40,
//     alignItems: 'center',
//     marginBottom: 24,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderStyle: 'dashed',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   uploadIcon: {
//     marginBottom: 16,
//   },
//   uploadTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1F2937',
//     marginBottom: 8,
//   },
//   uploadDescription: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 16,
//   },
//   uploadFormats: {
//     backgroundColor: '#F3F4F6',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   formatText: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontWeight: '600',
//   },
//   selectedFileCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   fileInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   fileIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 8,
//     backgroundColor: '#EBF8FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   fileDetails: {
//     flex: 1,
//   },
//   fileName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   fileSize: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   fileType: {
//     fontSize: 12,
//     color: '#9CA3AF',
//   },
//   removeFileButton: {
//     padding: 8,
//   },
//   uploadButton: {
//     backgroundColor: '#3B82F6',
//     borderRadius: 12,
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 24,
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   uploadButtonDisabled: {
//     backgroundColor: '#9CA3AF',
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   uploadButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginRight: 8,
//   },
//   tipsCard: {
//     backgroundColor: '#FFFBEB',
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: '#FDE68A',
//   },
//   tipsTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#92400E',
//     marginBottom: 16,
//   },
//   tipsList: {
//     gap: 8,
//   },
//   tipText: {
//     fontSize: 14,
//     color: '#92400E',
//     lineHeight: 20,
//   },
// });
